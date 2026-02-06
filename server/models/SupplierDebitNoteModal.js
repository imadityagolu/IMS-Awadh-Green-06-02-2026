const mongoose = require("mongoose");

const debitNoteSchema = new mongoose.Schema(
  {
    debitNoteNumber: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CreatePurchaseOrder",
    },
    supplierInvoiceNo: {
      type: String,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    address: {
      type: mongoose.Schema.Types.Mixed, // Can be string or object
    },
    date: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      enum: [
        "returned_goods",
        "defective_goods",
        "short_supply",
        "over_charging",
        "price_adjustment",
        "quality_issue",
        "late_delivery",
        "wrong_items",
        "error_correction",
        "other",
      ],
      required: true,
    },
    reasonDescription: {
      type: String,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: {
          type: String,
          required: true,
        },
        description: String,
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        unit: {
          type: String,
          default: "pcs",
        },
        unitPrice: {
          type: Number,
          required: true,
        },
        taxRate: {
          type: Number,
          default: 0,
        },
        taxAmount: {
          type: Number,
          default: 0,
        },
        discountPercent: {
          type: Number,
          default: 0,
        },
        discountAmount: {
          type: Number,
          default: 0,
        },
        total: {
          type: Number,
          required: true,
        },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
    },
    additionalCharges: {
      type: Number,
      default: 0,
    },
    roundOff: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "issued", "cancelled", "settled"],
      default: "draft",
    },
    settledDate: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
    notes: String,
    // Supplier specific fields (optional)
    purchaseOrderNo: String,
    deliveryChallanNo: String,
    grnNo: String, // Goods Receipt Note Number
    returnDate: Date,
  },
  {
    timestamps: true,
  },
);

// Add this middleware to handle updates properly
debitNoteSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (update.$set && update.$set.items) {
    // Calculate totals from items
    const items = update.$set.items;
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    items.forEach((item) => {
      const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
      subtotal += itemSubtotal;

      let discountAmount = item.discountAmount || 0;
      if (item.discountPercent > 0) {
        discountAmount = itemSubtotal * (item.discountPercent / 100);
      }
      totalDiscount += discountAmount;

      const taxableAmount = Math.max(0, itemSubtotal - discountAmount);
      const taxAmount = taxableAmount * ((item.taxRate || 0) / 100);
      totalTax += taxAmount;

      // Update item totals
      item.discountAmount = parseFloat(discountAmount.toFixed(2));
      item.taxAmount = parseFloat(taxAmount.toFixed(2));
      item.total = parseFloat((taxableAmount + taxAmount).toFixed(2));
    });

    update.$set.subtotal = parseFloat(subtotal.toFixed(2));
    update.$set.totalTax = parseFloat(totalTax.toFixed(2));
    update.$set.totalDiscount = parseFloat(totalDiscount.toFixed(2));

    const additionalCharges = update.$set.additionalCharges || 0;
    const roundOff = update.$set.roundOff || 0;
    update.$set.totalAmount = parseFloat(
      (
        subtotal +
        totalTax -
        totalDiscount +
        additionalCharges +
        roundOff
      ).toFixed(2),
    );
  }

  next();
});

// Generate debit note number
debitNoteSchema.statics.generateDebitNoteNumber = async function () {
  const count = await this.countDocuments();
  const year = new Date().getFullYear();
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const day = new Date().getDate().toString().padStart(2, "0");
  return `DN/${year}${month}${day}/${(count + 1).toString().padStart(3, "0")}`;
};

// Calculate totals before saving
debitNoteSchema.pre("save", function (next) {
  if (this.isModified("items")) {
    // Calculate item totals
    this.items.forEach((item) => {
      const itemSubtotal = item.unitPrice * item.quantity;
      const discount =
        item.discountAmount ||
        (itemSubtotal * (item.discountPercent || 0)) / 100;
      const taxable = Math.max(itemSubtotal - discount, 0);
      const tax = (taxable * (item.taxRate || 0)) / 100;

      item.discountAmount = discount;
      item.taxAmount = tax;
      item.total = taxable + tax;
    });

    // Calculate document totals
    this.subtotal = this.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    this.totalTax = this.items.reduce(
      (sum, item) => sum + (item.taxAmount || 0),
      0,
    );
    this.totalDiscount = this.items.reduce(
      (sum, item) => sum + (item.discountAmount || 0),
      0,
    );

    this.totalAmount =
      this.subtotal +
      this.totalTax -
      this.totalDiscount +
      (this.additionalCharges || 0) +
      (this.roundOff || 0);
  }
  next();
});

module.exports = mongoose.model("SupplierDebitNote", debitNoteSchema);

const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    itemName: { type: String, required: true },
    hsn: { type: String },
    qty: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    taxType: { type: String, required: true },
    taxRate: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0 },
    discountPct: { type: Number, default: 0 },
    discountAmt: { type: Number, default: 0 },
    amount: { type: Number, required: true, min: 0 },
    images: [
      {
        url: String,
        public_id: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: false }
);

const createPurchaseOrderSchema = new mongoose.Schema(
  {
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    invoiceNo: {
      type: String,
      required: true,
      unique: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    items: [itemSchema],

    billingAddress: { type: String, required: true },
    shippingAddress: { type: String },

    subtotal: { type: Number, required: true, min: 0 },
    totalTax: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },

    additionalDiscount: {
      pct: { type: Number, default: 0 },
      amt: { type: Number, default: 0 },
    },

    additionalCharges: {
      type: Number,
      default: 0,
    },
    additionalChargesDetails: {
      shipping: { type: Number, default: 0 },
      handling: { type: Number, default: 0 },
      packing: { type: Number, default: 0 },
      service: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },

    autoRoundOff: { type: Boolean, default: false },
    roundOffValue: { type: Number, default: 0 },

    grandTotal: { type: Number, required: true, min: 0 },

    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    advanceAmount: { type: Number, default: 0 },
    fullyReceived: { type: Boolean, default: false },

    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "bank_transfer", "credit", "multiple"],
      default: "cash",
    },

    paymentHistory: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        method: { type: String, required: true },
        reference: { type: String },
        notes: { type: String },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
        },
      },
    ],

    status: {
      type: String,
      enum: ["draft", "converted",  "received", "partial", "cancelled", "overdue"],
      default: "converted",
    },

    attachments: [
      {
        url: { type: String },
        public_id: { type: String },
        filename: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    notes: { type: String },
    termsAndConditions: { type: String },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
    },
  },
  { timestamps: true }
);

// Virtuals
createPurchaseOrderSchema.virtual("formattedDate").get(function () {
  return this.invoiceDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
});

createPurchaseOrderSchema.virtual("formattedDueDate").get(function () {
  return this.dueDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
});

// Indexes
createPurchaseOrderSchema.index({ supplierId: 1, status: 1 });
createPurchaseOrderSchema.index({ invoiceDate: -1 });
createPurchaseOrderSchema.index({ createdBy: 1 });

// Pre-save middleware
createPurchaseOrderSchema.pre("save", function (next) {
  if (this.dueDate < this.invoiceDate) {
    this.dueDate = new Date(this.invoiceDate);
    this.dueDate.setDate(this.dueDate.getDate() + 30); // Default 30 days for suppliers
  }
  next();
});

// Method to calculate totals
createPurchaseOrderSchema.methods.calculateTotals = function () {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + item.qty * item.unitPrice;
  }, 0);

  // Calculate total tax
  this.totalTax = this.items.reduce((sum, item) => {
    return sum + (item.taxAmount || 0);
  }, 0);

  // Calculate items discount
  const itemsDiscount = this.items.reduce((sum, item) => {
    return sum + (item.discountAmt || 0);
  }, 0);

  // Calculate additional discount
  let additionalDiscountValue = 0;
  if (this.additionalDiscount) {
    if (this.additionalDiscount.pct > 0) {
      additionalDiscountValue =
        (this.subtotal * this.additionalDiscount.pct) / 100;
    } else if (this.additionalDiscount.amt > 0) {
      additionalDiscountValue = this.additionalDiscount.amt;
    }
  }

  this.totalDiscount = itemsDiscount + additionalDiscountValue;

  // Calculate additional charges
  const additionalChargesDetails = this.additionalChargesDetails || {};
  const {
    shipping = 0,
    handling = 0,
    packing = 0,
    service = 0,
    other = 0,
  } = additionalChargesDetails;
  this.additionalCharges = shipping + handling + packing + service + other;

  // Calculate grand total
  let grandTotalBefore =
    this.subtotal + this.totalTax + this.additionalCharges - this.totalDiscount;

  // Apply round off if enabled
  if (this.autoRoundOff) {
    this.roundOffValue = Math.round(grandTotalBefore) - grandTotalBefore;
    this.grandTotal = Math.max(0, Math.round(grandTotalBefore));
  } else {
    this.roundOffValue = 0;
    this.grandTotal = Math.max(0, grandTotalBefore);
  }

  // Calculate payment amounts
  this.dueAmount = Math.max(0, this.grandTotal - (this.paidAmount || 0));
  this.advanceAmount = Math.max(0, (this.paidAmount || 0) - this.grandTotal);

  // Update status based on payment
  // 🔐 Only auto-update payment-related statuses
  const finalizedStatus = ["converted", "received", "cancelled"];
  if(!finalizedStatus.includes(this.status)) {
  if (this.fullyReceived || (this.paidAmount || 0) >= this.grandTotal) {
    this.status = "received";
  } else if ((this.paidAmount || 0) > 0) {
    this.status = "partial";
  }

  if (this.dueAmount > 0 && new Date() > this.dueDate) {
    this.status = "overdue";
  }
}
}

module.exports =
  mongoose.models.CreatePurchaseOrder ||
  mongoose.model("CreatePurchaseOrder", createPurchaseOrderSchema);

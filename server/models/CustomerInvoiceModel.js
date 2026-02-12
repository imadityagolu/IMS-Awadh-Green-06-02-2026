const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    itemName: { type: String, required: true },
    hsnCode: { type: String },
    serialNumbers: [
      {
        type: String,
        index: true,
      },
    ],
    description:{type:String},
    lotNumber: { type: String }, // Add lot number field
    selectedSerialNos: [{ type: String }],
    qty: { type: Number, required: true, min: 1 }, // CHANGED min: 0 to min: 1
    unit: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    taxType: { type: String, required: true },
    taxRate: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0 },
    discountPct: { type: Number, default: 0 },
    discountAmt: { type: Number, default: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
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

    bankDetails: {
      bankName: String,
      accountHolderName: String,
      accountNumber: String,
      ifsc: String,
      branch: String,
      upiId: String,
      qrCode: String,
    },

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

    shoppingPointsUsed: { type: Number, default: 0 },
    pointValue: { type: Number, default: 10 }, // KEEP ONLY THIS ONE

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

    status: {
      type: String,
      enum: ["draft", "sent", "paid", "partial", "cancelled", "overdue"],
      default: "draft",
    },
    // for tax and setting field
    taxSettings: {
      enableGSTBilling: { type: Boolean, default: true },
      priceIncludeGST: { type: Boolean, default: true },
      autoRoundOff: {
        type: String,
        enum: ["0", "1", "5", "10"],
        default: "0",
      },
      defaultGSTRate: { type: String, default: "18" },
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
      // required: true
    },
  },
  { timestamps: true },
);

// Virtuals
invoiceSchema.virtual("formattedDate").get(function () {
  return this.invoiceDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
});

invoiceSchema.virtual("formattedDueDate").get(function () {
  return this.dueDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
});

// Indexes
invoiceSchema.index({ customerId: 1, status: 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ createdBy: 1 });

// Pre-save middleware
invoiceSchema.pre("save", function (next) {
  if (this.dueDate < this.invoiceDate) {
    this.dueDate = new Date(this.invoiceDate);
    this.dueDate.setDate(this.dueDate.getDate() + 7);
  }
  // also add overdue status check
  const today = new Date();
  if (
    this.dueDate < today &&
    this.status !== "paid" &&
    this.status !== "cancelled" &&
    this.dueAmount > 0
  ) {
    this.status = "overdue";
  }
  next();
});

//virtual for due date status
// Virtual for due date status
invoiceSchema.virtual("dueStatus").get(function () {
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (this.status === "paid" || this.status === "cancelled") {
    return "paid";
  } else if (diffDays < 0) {
    return "overdue";
  } else if (diffDays === 0) {
    return "due-today";
  } else if (diffDays <= 7) {
    return "due-soon";
  } else {
    return "pending";
  }
});

// Virtual for days remaining
invoiceSchema.virtual("daysRemaining").get(function () {
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});
// Method to calculate totals - UPDATED TO MATCH FRONTEND
invoiceSchema.methods.calculateTotals = function () {
  // Calculate subtotal from items (qty * unitPrice)
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

  // Calculate additional discount (matches frontend logic)
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

  // Calculate points redeemed amount (matches frontend: points * pointValue)
  const pointsRedeemedAmount =
    (this.shoppingPointsUsed || 0) * (this.pointValue || 10);

  // Calculate grand total (matches frontend formula)
  let grandTotalBefore =
    this.subtotal +
    this.totalTax +
    this.additionalCharges -
    this.totalDiscount -
    pointsRedeemedAmount;

  // Apply round off if enabled (matches frontend)
  if (this.autoRoundOff) {
    this.roundOffValue = Math.round(grandTotalBefore) - grandTotalBefore;
    this.grandTotal = Math.max(0, Math.round(grandTotalBefore));
  } else {
    this.roundOffValue = 0;
    this.grandTotal = Math.max(0, grandTotalBefore);
  }

  // Calculate payment amounts (matches frontend)
  this.dueAmount = Math.max(0, this.grandTotal - (this.paidAmount || 0));
  this.advanceAmount = Math.max(0, (this.paidAmount || 0) - this.grandTotal);

  // Update status based on payment (matches frontend logic)
  if (this.fullyReceived || (this.paidAmount || 0) >= this.grandTotal) {
    this.status = "paid";
  } else if ((this.paidAmount || 0) > 0) {
    this.status = "partial";
  }
  // If paidAmount is 0 and not fullyReceived, keep as draft
};

module.exports =
  mongoose.models.CustomerInvoice ||
  mongoose.model("CustomerInvoice", invoiceSchema);

const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
  {
    addressLine: { type: String },
    country:{ type: String },
    state: { type: String },
    city: { type: String },
    pincode: { type: String },
  },
  { _id: false }
);

const BankSchema = new mongoose.Schema(
  {
    bankName: { type: String },
    accountNumber: { type: String },
    ifsc: { type: String },
    branch: { type: String },
  },
  { _id: false }
);

const SupplierSchema = new mongoose.Schema(
  {
    supplierCode: { type: String, unique: true },

    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    businessType: {
      type: String,
      required: true,
      enum: ["Manufacturer", "Distributor", "Wholesaler"],
    },

    gstin: { type: String },
    phone: { type: String, required: true },
    email: { type: String },

    categoryBrand: { type: String },

    address: AddressSchema,
    bank: BankSchema,

    status: { type: Boolean, default: true },

    // for purchase
     totalInvoices: {
      type: Number,
      default: 0,
    },
    totalPurchaseAmount: {
      type: Number,
      default: 0,
    },
    totalPaidAmount: {
      type: Number,
      default: 0,
    },
    totalDueAmount: {
      type: Number,
      default: 0,
    },
    averageOrderValue: {
      type: Number,
      default: 0,
    },
    lastInvoiceDate: {
      type: Date,
    },
    firstInvoiceDate: {
      type: Date,
    },
    lastPurchaseAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", SupplierSchema);

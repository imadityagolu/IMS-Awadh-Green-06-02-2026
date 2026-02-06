const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
    },

    itemBarcode: { type: String },

    hsn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HSN",
    },
    serialno: { type: String, default: "" },

    purchasePrice: { type: Number, required: true, min: 1 },

    mrp: { type: Number },

    sellingPrice: { type: Number, required: true, min: 1 },

    tax: String,

    size: String,

    color: String,

    expiryDate: Date,

    unit: String,

    openingQuantity: { type: Number, required: true, min: 1 },

    minStockToMaintain: { type: Number, required: true, min: 1 },

    discountAmount: Number,

    discountType: String,

    stockQuantity: {
      type: Number,
      default: 0,
      min: 0
    },

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],

    lotDetails: {
      lotNo: String,
      lotmrp: String,
      fabricBatchNo: String,
      productionDate: String,
      designCode: String,
      quantity: Number,
      size: String,
      color: String,
    },

    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);

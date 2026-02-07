const mongoose = require("mongoose");
const productSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },

    description: { 
      type: String,
      default: ""
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
    
    lotNumber: { type: String, default: "" },

    lotSupplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },

    unit: String,

    purchasePrice: { type: Number, required: true, min: 1 },

    tax: String,

    quantityInLot: { type: Number, default: 1 },

    sellingPrice: { type: Number, required: true, min: 1 },

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],

    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);

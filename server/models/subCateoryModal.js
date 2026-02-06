// models/Subcategory.js
const mongoose = require("mongoose");

const SubcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// ✅ allow same name in different categories
SubcategorySchema.index({ name: 1, category: 1 }, { unique: true });

module.exports = mongoose.model("Subcategory", SubcategorySchema);

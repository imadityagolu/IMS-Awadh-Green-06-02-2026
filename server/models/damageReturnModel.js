const mongoose = require("mongoose");

const DamageReturnSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 0 },
    remarks: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DamageReturn", DamageReturnSchema);

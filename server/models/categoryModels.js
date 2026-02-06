// models/Category.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    subcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subcategory",
        default: [], // ✅ MUST
      },
    ],
    isDelete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);


// // models/Category.js
// const mongoose = require("mongoose");

// const categorySchema = new mongoose.Schema(
//   {
//     categoryName: {
//       type: String,
//       required: true,
//       unique: true,
//       trim: true,
//     },
//     subcategories: [
//       {
//         subCategoryName: String,
//       },
//     ],
//     noOfProducts: {
//       type: Number,
//       default: 0,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Category", categorySchema);

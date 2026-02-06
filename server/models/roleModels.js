// models/roleModels.js
const mongoose = require("mongoose");

// ✅ Permission schema matching your sidebar needs
const permissionSchema = new mongoose.Schema(
  {
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    all: { type: Boolean, default: false } // Added "all" field for easy checking
  },
  { _id: false }
);

// Main Role Schema
const roleSchema = new mongoose.Schema(
  {
    roleName: {
      type: String,
      required: [true, "Role name is required"],
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    // ✅ ONLY ONE structure now - modulePermissions
    modulePermissions: {
      type: Map,
      of: permissionSchema,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for member count
roleSchema.virtual("memberCount", {
  ref: "Users",
  localField: "_id",
  foreignField: "role",
  count: true,
});

module.exports = mongoose.model("Role", roleSchema);

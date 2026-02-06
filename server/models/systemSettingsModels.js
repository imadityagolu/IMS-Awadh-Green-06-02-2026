const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
    {
        brand: {
            type: Boolean,
            default: false,
        },
        description: {
            type: Boolean,
            default: false,
        },
        category: {
            type: Boolean,
            default: false,
        },
        subcategory: {
            type: Boolean,
            default: false,
        },
        itembarcode: {
            type: Boolean,
            default: false,
        },
        hsn: {
            type: Boolean,
            default: false,
        },
        lotno: {
            type: Boolean,
            default: false,
        },
        supplier: {
            type: Boolean,
            default: false,
        },
        serialno: {
            type: Boolean,
            default: false,
        },
        status: {
            type: Boolean,
            default: false,
        },
        variants: {
            size: {
                type: Boolean,
                default: false,
            },
            color: {
                type: Boolean,
                default: false,
            },
        },
        units: {
            type: Boolean,
            default: false,
        },
        expiry: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true, // ✅ This adds createdAt and updatedAt automatically
    }
);

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
const mongoose = require("mongoose");

const taxGstSchema = new mongoose.Schema(
  {
    // GST Settings
    enableGSTBilling: {
      type: Boolean,
      default: true
    },
    
    defaultGSTRate: {
      type: String,
      enum: ["0", "5", "12", "18", "28", ""],
      default: "18"
    },
    
    priceIncludeGST: {
      type: Boolean,
      default: true
    },
    
    // Round Off Settings
    autoRoundOff: {
      type: String,
      enum: ["0", "1", "5", "10"],
      default: "0"
    },
    
    // Status
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Create a single document
taxGstSchema.statics.getSingleSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model("TaxGst", taxGstSchema);
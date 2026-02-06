const mongoose = require("mongoose");

const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

const companysettingSchema = new mongoose.Schema({
  // Basic Information
  companyName: { type: String, required: true },
  companyTitle: {
  type: String,
  default: "",
},

  companyemail: { type: String, required: true },
  companyphone: { type: String, required: true },
  website: { type: String },
  
  // Business Information
  gstin: {
    type: String,
    match: [gstinRegex, "Invalid GSTIN format"]
  },
  panNo: {
    type: String,
    match: [panRegex, "Invalid PAN format"]
  },
  businessType: { type: String },
  
  // Contact Information
  alternativePhone: { type: String },
  companyfax: { type: String }, // Kept for backward compatibility
  
  // Address Information (from new UI)
  companyaddress: { type: String, required: true },
  billingAddress: { type: String },
  shippingAddress: { type: String },
  
  // Location fields (optional, keep for backward compatibility)
  companycountry: { type: String, default: "India" },
  companystate: { type: String },
  companycity: { type: String },
  companypostalcode: { type: String },
  
  // Old fields that can be removed or made optional
  cin: { type: String }, // Made optional since not in new UI
  companydescription: { type: String }, // Renamed/repurposed from old
  
  // Branding Images
  companyIcon: { type: String },
  companyFavicon: { type: String },
  companyLogo: { type: String },
  companyDarkLogo: { type: String },
  
}, {
  timestamps: true,
});

// Add validation for phone numbers
companysettingSchema.pre('save', function(next) {
  if (this.companyphone && !/^[0-9]{10}$/.test(this.companyphone)) {
    next(new Error('Invalid company phone number'));
  }
  if (this.alternativePhone && !/^[0-9]{10}$/.test(this.alternativePhone)) {
    next(new Error('Invalid alternative phone number'));
  }
  next();
});

const companysettingModal = mongoose.model("companysetting", companysettingSchema);
module.exports = companysettingModal;
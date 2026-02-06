const mongoose = require('mongoose');

const RewardSystemSchema = new mongoose.Schema({
  rewardType: {
    type: String,
    required: true,
    enum: ['Shopping Points', 'Cashback', 'Referral', 'Tiered'],
  },
  offerName: { type: String, trim: true },
  amountForPoint: { type: Number },
  minPurchase: { type: Number },
  deadline: { type: Date },
  pointValue: { type: Number },
  maxEligibleAmount: { type: Number },
  minInvoiceValue: { type: Number },
  status: {
    type: String,
    enum: ['active', 'expired'],
    default: 'active',
  },
  // createdBy: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'User',
  //   // required: true,  // comment out if no auth yet
  // },
  createdAt: { type: Date, default: Date.now },
  shareLink: { type: String },
  isDelete: { type: Boolean, default: false },
});

RewardSystemSchema.pre('save', function (next) {
  if (this.isNew && !this.shareLink) {
    this.shareLink = `https://yourapp.com/rewards/${this._id}`;
  }
  next();
});

module.exports = mongoose.model('RewardSystem', RewardSystemSchema);
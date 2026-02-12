const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, unique: true, sparse: true }, // Added for new UI
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    plainPassword:{type:String},  //for temporary
    lastLogin: { type: Date }, // Added for new UI
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },
    // for profile image
    profileImage: {
      url: { type: String },
      public_id: { type: String },
    },
    companyId: {  
    type: mongoose.Schema.Types.ObjectId,
    ref: "companysetting",
    required: false // or true, depending on your business logic
  },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: String },
    resetPasswordOTP: { type: String },
    resetPasswordOTPExpires: { type: Date },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    resetToken: String,
    resetTokenExpire: Date,
    status: {
      type: String,
      enum: ["Active", "Inactive", "Blacklist"], // Updated with Blacklist
      default: "Active",
    },
    // Two Factor authentication
    twoFactorEnabled: { type: Boolean, default: true },
    otp: { type: String },
    otpExpires: { type: Date },

    // ✅ Add this new field
    trustedDevices: [
      {
        deviceId: { type: String },
        deviceInfo: { type: String },
        addedAt: { type: Date, default: Date.now },
      },
    ],

    // sessions or refresh tokens - for multi device logout
    refreshTokens: [
      {
        token: { type: String },
        deviceInfo: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ✅ Keep _id and do NOT convert it to id
usersSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    return ret;
  },
});

// Helper method: check if password changed after JWT issued
usersSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if(this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp
  }
  //false means not changed
  return false;
}

usersSchema.methods.removeToken = async function (token) {
  this.refreshTokens = this.refreshTokens.filter(t => t.token !== token);
  await this.save();
};

module.exports = mongoose.model("Users", usersSchema);
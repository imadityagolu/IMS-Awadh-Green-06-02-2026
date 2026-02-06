const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/usersModels");
const Otp = require("../models/otpModels");
const sendEmail = require("../utils/sendEmail");
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  path: "/",
   maxAge: 24 * 60 * 60 * 1000,
};
// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Allow max 3 OTPS/hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await Otp.find({
      email: normalizedEmail,
      createdAt: { $gte: oneHourAgo },
    });
    if (recentOtps.length >= 3) {
      return res
        .status(429)
        .json({ message: "Too many OTP requests. Try again later" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await Otp.deleteMany({ email });

    const otp = new Otp({ email: normalizedEmail, otp: otpCode });
    await otp.save();

    await sendEmail(
      normalizedEmail,
      "OTP for Password Reset",
      `Your OTP is: ${otpCode}`
    );

    res.status(200).json({ message: "OTP sent to registered email" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// verify otp and  check otp

exports.verifyOtpCheck = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find OTP entry
    const validOtp = await Otp.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Check expiry
    if (validOtp.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    res.status(200).json({ message: "OTP Verified successfully" });
  } catch (error) {
    console.error("OTP verification error", error);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
};

// VERIFY OTP & RESET PASSWORD
exports.verifyOtpAndReset = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const validOtp = await Otp.findOne({ email, otp });
    if (!validOtp)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = new Date(); // i added this 17-10-25
    await user.save();

    await Otp.deleteMany({ email });

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// this is for two factor auth

exports.verifyotp = async (req, res) => {
  try {
    // 🔐 OTP session check
    if (!req.cookies.otpPending) {
      return res.status(401).json({
        message: "OTP session expired. Please login again.",
      });
    }

    const { email, otp, deviceId, deviceInfo } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).populate(
      "role"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (String(user.otp) !== String(otp) || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Clear OTP
    user.otp = null;
    user.otpExpires = null;

    if (deviceId && !user.trustedDevices.some((d) => d.deviceId === deviceId)) {
      user.trustedDevices.push({ deviceId, deviceInfo });
    }

    await user.save();

    // ✅ CLEAR otpPending (IMPORTANT)
    res.clearCookie("otpPending");
    res.clearCookie("otpEmail");

    const roleData = user.role
      ? {
          roleName: user.role.roleName,
          modulePermissions: Object.fromEntries(
            user.role.modulePermissions || []
          ),
        }
      : null;

    const token = jwt.sign(
      { id: user._id, email: user.email, role: roleData },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const twoFAToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    // ✅ ADD userId cookie that your frontend expects
   const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };

    res.cookie("token", token, cookieOptions);
    res.cookie("twoFAToken", twoFAToken, cookieOptions);
     // ✅ SET USER ID COOKIE
    res.cookie("userId", user._id.toString(), {
      httpOnly: false, // Allow frontend to read
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    // After setting cookies, add:
console.log("✅ OTP Verification - Cookies set:", {
  tokenSet: !!token,
  twoFATokenSet: !!twoFAToken,
  userIdSet: !!user._id,
  cookieOptions: cookieOptions
});

    res.status(200).json({
      message: "OTP Verified successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        status: user.status,
        role: roleData,
      },
    });
  } catch (error) {
    console.error("OTP verification error", error);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    // FIX: Get email from request body OR cookie
    let email = req.body.email;

    // If no email in request body, try to get from cookie
    if (!email && req.cookies.otpEmail) {
      email = req.cookies.otpEmail;
      console.log("Got email from cookie:", email);
    }

    if (!email) {
      return res.status(400).json({
        message: "Email required. Please login again.",
      });
    }
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.twoFactorEnabled) {
      return res
        .status(400)
        .json({ message: "Two factor is not enabled for this user" });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiry = Date.now() + 5 * 60 * 1000;
    user.otp = otp;
    user.otpExpires = expiry;
    await user.save();
    await sendEmail(email, "Your Login OTP", `Your OTP code is: ${otp}`);
    // Also reset/update the cookie timer
    res.cookie("otpPending", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 5 * 60 * 1000,
      path: "/",
    });

    res.status(200).json({
      message: "OTP resent to your email",
      email: email,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Server error during OTP resend" });
  }
};

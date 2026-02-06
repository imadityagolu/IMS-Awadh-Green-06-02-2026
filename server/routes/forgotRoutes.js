const express = require("express");
const router = express.Router();

const {
  forgotPassword,
  verifyOtpCheck,
  verifyOtpAndReset,
  verifyotp,
  resendOtp,
} = require("../controllers/forgotController");

// Forgot password → send OTP
router.post("/forgot-password", forgotPassword);

// After forgot → verify OTP only
router.post("/verify-otp-reset-check", verifyOtpCheck);

// Verify OTP & reset password
router.post("/verify-otp-reset", verifyOtpAndReset);

// 2FA OTP verify (login flow)
router.post("/verify-otp", verifyotp);

// Resend OTP
router.post("/resend-otp", resendOtp);

module.exports = router;

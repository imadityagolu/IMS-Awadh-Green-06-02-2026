const express = require("express");
const router = express.Router();

const {
  loginUser,
  logoutUser,
  logDevice,
  getMe,
} = require("../controllers/authController");

const { authMiddleware } = require("../middleware/auth");

// Login
router.post("/login", loginUser);

// Logout
router.post("/logout", logoutUser);

// Log device (protected)
router.post("/log-device", authMiddleware, logDevice);

// Get logged-in user
router.get("/me", authMiddleware, getMe);

module.exports = router;

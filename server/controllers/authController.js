const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/usersModels");
const axios = require("axios");
const DeviceSession = require("../models/settings/DeviceManagementmodal");
const sendEmail = require("../utils/sendEmail");

const cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "Lax",
  path: "/",
};

exports.loginUser = async (req, res) => {
  const { email, password, deviceId, deviceInfo } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).populate(
      "role"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    //  Prevent inactive users from logging in

    if (user.status === "Inactive") {
      return res
        .status(403)
        .json({ message: "Your account is inactive. Please contact admin." });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    // ✅ UPDATE LAST LOGIN HERE
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // check if device is trusted
    const isTrustedDevice = user.trustedDevices.some(
      (d) => d.deviceId === deviceId
    );

    const roleData = user.role
      ? {
          roleName: user.role.roleName,
          modulePermissions: Object.fromEntries(
            user.role.modulePermissions || []
          ),
        }
      : null;

    const tokenPayload = {
      id: user._id,
      email: user.email,
      // role: roleData,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

   if (!user.twoFactorEnabled || (user.twoFactorEnabled && isTrustedDevice)) {
      res.cookie("token", token, cookieOptions);

      res.cookie("userId", user._id, cookieOptions);
      return res.status(200).json({
        message: "Login successful(trusted device)",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          status: user.status,
          role: roleData,
        },
      });
    }

    const now = Date.now();
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiry = now + 5 * 60 * 1000;
    user.otp = otp;
    user.otpExpires = expiry;
    await user.save();

    await sendEmail(email, "your Login OTP", `your OTP code is: ${otp}`);
    // CORRECT: Should be "otpPending" AND "otpEmail"
    res.cookie("otpPending", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 5 * 60 * 1000,
      path: "/",
    });

    res.cookie("otpEmail", user.email, {
      // ADD THIS
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      maxAge: 5 * 60 * 1000,
      path: "/",
    });
    return res.status(200).json({
      message: "OTP sent to your email",
      twoFactor: true,
      email: user.email,
    });
  } catch (err) {
    console.error("Login error:", err.message); // Print error message
    console.error(err.stack); // Print stack trace
    res.status(500).json({
      message: "Server error",
      error: err.message, // Show actual error in response
    });
  }
};
// LOGOUT
exports.logoutUser = async (req, res) => {
  try {
    // For JWT, you usually handle logout on client side
    res.clearCookie("token", cookieOptions);
    res.clearCookie("userId", cookieOptions);
    res.clearCookie("twoFAToken", cookieOptions);
    res.clearCookie("otpPending", { path: "/" }); // ADD THIS
    res.clearCookie("otpEmail", { path: "/" }); // ADD THIS
    res.clearCookie("user", { path: "/" });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
//this is for login device maintain location
exports.logDevice = async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;
    let ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "")
      .split(",")[0]
      .trim();
    const userAgent = req.headers["user-agent"];
    let device = "Unknown";
    try {
      const browserName = userAgent.split("/")[0];
      const osMatch = userAgent.match(/\(([^)]+)\)/);
      const os = osMatch ? osMatch[1].split(";")[0].trim() : "Unknown";
      device = `${browserName} ${os.split(" ")[0]}`;
    } catch (error) {
      console.error("Error parsing user-agent", e.message);
    }
    let location = "Unknown";
    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
      ip = "127.0.0.1";
      location = "Localhost / Dev";
    } else {
      try {
        const { data } = await axios.get(`https://ipapi.co/${ip}/json/`);
        location = `${data.city}, ${data.region}, ${data.country_name}`;
      } catch (error) {
        console.log("IP location failed:", error.message);
      }
    }
    console.log("Creating device log for:", {
      userId,
      ip,
      location,
      latitude,
      longitude,
      device,
    });

    await DeviceSession.create({
      userId,
      device,
      ipAddress: ip,
      location,
      latitude,
      longitude,
    });
    console.log("Device log saved successfully");
    res.status(200).json({ message: "Device logged" });
  } catch (error) {
    console.error("Log Device Error", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};
// ======================
// GET LOGGED-IN USER
// ======================
exports.getMe = async (req, res) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.id).populate("role");

    if (!user) {
       res.clearCookie("token");
  res.clearCookie("userId");
  return res.status(401).json({ logout: true });
    }

    const roleData = user.role
      ? {
          roleName: user.role.roleName,
          modulePermissions: Object.fromEntries(
            user.role.modulePermissions || []
          ),
        }
      : null;

    return res.status(200).json({
      user: {
        id: user._id,
        name:user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        status: user.status,
        role: roleData,
      },
    });
  } catch (error) {
    console.error("GetMe Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

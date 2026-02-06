const express = require("express");
const upload = require("../../config/upload"); // This now uses Cloudinary
const {
  addCompanyBank,
  getCompanyBanks,
  getDefaultBank,
  updateCompanyBank
} = require("../../controllers/settings/companyBankController");

const router = express.Router();

// Both routes use the same upload middleware
router.post("/add", upload.single("qrCode"), addCompanyBank);
router.get("/list", getCompanyBanks);
router.get("/default", getDefaultBank);
router.put("/update/:id", upload.single("qrCode"), updateCompanyBank);

module.exports = router;
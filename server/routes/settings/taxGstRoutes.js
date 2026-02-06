const express = require("express");
const router = express.Router();
const {
  getTaxGstSettings,
  updateTaxGstSettings,
  resetTaxGstSettings,
} = require("../../controllers/settings/taxGstController");

// No authentication middleware needed if it's already applied globally

router.get("/", getTaxGstSettings);
router.put("/", updateTaxGstSettings);
router.post("/reset", resetTaxGstSettings);

module.exports = router;
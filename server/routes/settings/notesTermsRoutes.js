const express = require("express");
const router = express.Router();
const {
  getNotesTermsSettings,
  updateNotesTermsSettings,
} = require("../../controllers/settings/notesTermsController");

router.get("/", getNotesTermsSettings);
router.put("/", updateNotesTermsSettings);

module.exports = router;

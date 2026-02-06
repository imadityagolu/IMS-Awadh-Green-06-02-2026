const express = require("express");
const router = express.Router();
const bagController = require("../controllers/bagController");
const upload = require("../config/upload");

router.post("/add", upload.single("image"), bagController.addBag);
router.post("/delete", bagController.deleteBags);
router.get("/get", bagController.getBags);

module.exports = router;

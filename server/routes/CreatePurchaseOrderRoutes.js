const express = require("express");
const router = express.Router();
const CreatePurchaseOrderController = require("../controllers/CreatePurchaseOrderController");
const { authMiddleware } = require("../middleware/auth");
const multer = require("multer");

// Create multer upload middleware
const uploadMiddleware = multer({
  storage: multer.diskStorage({
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images (jpeg, jpg, png) and PDFs are allowed"));
    }
  },
}).array("attachments", 5);

// Routes
router.post(
  "/",
  authMiddleware,
  uploadMiddleware,
  CreatePurchaseOrderController.createInvoice
);

router.get(
  "/",
  authMiddleware,
  CreatePurchaseOrderController.getAllInvoices
);
router.get(
  "/stats",
  authMiddleware,
  CreatePurchaseOrderController.getInvoiceStats
);
router.get(
  "/:id",
  authMiddleware,
  CreatePurchaseOrderController.getInvoiceById
);
router.put(
  "/:id",
  authMiddleware,
  uploadMiddleware,
  CreatePurchaseOrderController.updateInvoice
);
router.delete(
  "/:id",
  authMiddleware,
  CreatePurchaseOrderController.deleteInvoice
);
router.post(
  "/:id/payment",
  authMiddleware,
  CreatePurchaseOrderController.addPayment
);

// Supplier-based queries
router.get(
  "/supplier/:supplierId",
  authMiddleware,
  CreatePurchaseOrderController.getInvoicesBySupplier
);
router.get(
  "/supplier/:supplierId/unpaid",
  authMiddleware,
  CreatePurchaseOrderController.getUnpaidInvoicesBySupplier
);
router.get(
  "/supplier/:supplierId/overdue",
  authMiddleware,
  CreatePurchaseOrderController.getOverdueInvoicesBySupplier
);

module.exports = router;

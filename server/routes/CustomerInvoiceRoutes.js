const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/CustomerInvoiceController");
const { authMiddleware } = require("../middleware/auth");
const upload = require("../config/upload"); // You'll need to create this

// Create multer upload middleware
const multer = require("multer");
const uploadMiddleware = multer({
  storage: multer.diskStorage({
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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
}).array("attachments", 5); // Max 5 files per upload

// Routes
router.post(
  "/",
  authMiddleware,
  uploadMiddleware,
  invoiceController.createInvoice
);

router.get("/", authMiddleware, invoiceController.getAllInvoices);
router.get("/stats", authMiddleware, invoiceController.getInvoiceStats);
router.get("/:id", authMiddleware, invoiceController.getInvoiceById);
router.put(
  "/:id",
  authMiddleware,
  uploadMiddleware,
  invoiceController.updateInvoice
);
router.delete("/:id", authMiddleware, invoiceController.deleteInvoice);
router.post("/:id/payment", authMiddleware, invoiceController.addPayment);

// In routes/CustomerInvoiceRoutes.js, add these routes:

// Get invoices by customer ID
router.get(
  "/customer/:customerId",
  authMiddleware,
  invoiceController.getInvoicesByCustomer
);

// Get overdue invoices by customer ID
router.get(
  "/customer/:customerId/overdue",
  authMiddleware,
  invoiceController.getOverdueInvoicesByCustomer
);

// Get unpaid invoices by customer ID
router.get(
  "/customer/:customerId/unpaid",
  authMiddleware,
  invoiceController.getUnpaidInvoicesByCustomer
);

// Sales list route
router.get("/sales/list", authMiddleware, invoiceController.getSalesList);

// for recentsales invocie
router.post("/send-email", authMiddleware, invoiceController.sendThroughEmail);
router.post("/send-sms", authMiddleware, invoiceController.sendThroughSMS);
// for overdue report
// In CustomerInvoiceRoutes.js, add:
router.get("/overdue/list", authMiddleware, invoiceController.getOverdueInvoices);
module.exports = router;

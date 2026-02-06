const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');

const upload = require("../middleware/Multer/multer");
const  {authMiddleware}=require("../middleware/auth.js")


// Create supplier
router.post('/',  authMiddleware,supplierController.createSupplier);


// Fetch all suppliers
router.get('/', authMiddleware,supplierController.getAllSuppliers);
router.get('/active', authMiddleware,supplierController.getActiveSuppliers);// router.get("/suppliers/active-dropdown", supplierController.getActiveSuppliersDropdown);


// Get single supplier
router.get('/:id',authMiddleware, supplierController.getSupplierById);

// Edit supplier
router.put('/:id', upload.array('images'),authMiddleware, supplierController.updateSupplier);

// Delete supplier
router.delete('/:id', authMiddleware, supplierController.deleteSupplier);




// Add these new routes
router.get("/:id/statistics", authMiddleware, supplierController.getSupplierStatistics);
router.post("/:id/recalculate-due", authMiddleware, supplierController.recalculateSupplierDue);



module.exports = router;





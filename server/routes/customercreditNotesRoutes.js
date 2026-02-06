const express = require('express');
const router = express.Router();
const creditNoteController = require('../controllers/customercreditNoteController');
const { authMiddleware } = require("../middleware/auth");


// Get all credit notes
router.get('/', authMiddleware, creditNoteController.getAllCreditNotes);

// Get credit note by ID
router.get('/:id', authMiddleware, creditNoteController.getCreditNoteById);

// Create new credit note
router.post('/', authMiddleware, creditNoteController.createCreditNote);

// Apply credit note to invoice
router.post('/:id/apply', authMiddleware, creditNoteController.applyCreditNote);

// Update credit note
router.put('/:id', authMiddleware, creditNoteController.updateCreditNote);

// Add this new route for status update
router.put('/:id/status', authMiddleware, creditNoteController.updateCreditNoteStatus);


// Delete credit note
router.delete('/:id', authMiddleware, creditNoteController.deleteCreditNote);

// Get credit notes by customer
router.get('/customer/:customerId', authMiddleware, creditNoteController.getCreditNotesByCustomer);

// Get credit notes by status
router.get('/status/:status', authMiddleware, creditNoteController.getCreditNotesByStatus);

// Get credit notes summary
router.get('/summary/overview', authMiddleware, creditNoteController.getCreditNotesSummary);

// Search credit notes
router.get('/search/all', authMiddleware, creditNoteController.searchCreditNotes);

// Cancel credit note
router.put('/:id/cancel', authMiddleware, creditNoteController.cancelCreditNote);

// Get recent credit notes
router.get('/recent/all', authMiddleware, creditNoteController.getRecentCreditNotes);

module.exports = router;
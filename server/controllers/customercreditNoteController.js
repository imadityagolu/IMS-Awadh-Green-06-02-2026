const CreditNote = require("../models/customerCreditNoteModel");
const Invoice = require("../models/CustomerInvoiceModel");
const Customer = require("../models/customerModel");
const mongoose = require("mongoose");



// Helper: Parse FormData (for consistency with invoice)
const parseFormDataNested = (body) => {
  const parsed = { ...body };

  // Parse tax settings
  if (body['taxSettings[autoRoundOff]'] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.autoRoundOff = body['taxSettings[autoRoundOff]'];
  }
  if (body['taxSettings[enableGSTBilling]'] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.enableGSTBilling = body['taxSettings[enableGSTBilling]'] !== "false";
  }
  if (body['taxSettings[priceIncludeGST]'] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.priceIncludeGST = body['taxSettings[priceIncludeGST]'] !== "false";
  }
  if (body['taxSettings[defaultGSTRate]'] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.defaultGSTRate = body['taxSettings[defaultGSTRate]'];
  }

  return parsed;
};



// Generate credit note number - SIMPLE FIX
// const generateCreditNoteNumber = async () => {
//   try {
//     const year = new Date().getFullYear().toString().slice(-2);
//     let nextNumber = 1;
//     let exists = true;

//     // Keep trying until we find a number that doesn't exist
//     while (exists) {
//       const proposedNumber = `CN-${year}-${nextNumber.toString().padStart(4, "0")}`;
//       const existing = await CreditNote.findOne({
//         creditNoteNumber: proposedNumber,
//       });

//       if (!existing) {
//         return proposedNumber;
//       }
//       nextNumber++;
//     }
//   } catch (error) {
//     console.error("Error generating credit note number:", error);
//     const year = new Date().getFullYear().toString().slice(-2);
//     // Use timestamp to ensure uniqueness
//     return `CN-${year}-${Date.now().toString().slice(-6)}`;
//   }
// };

// Generate credit note number - IMPROVED VERSION
const generateCreditNoteNumber = async () => {
  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    
    const prefix = `CN${year}${month}`;
    const count = await CreditNote.countDocuments({
      creditNoteNumber: { $regex: `^${prefix}` }
    });
    
    const sequence = String(count + 1).padStart(3, "0");
    return `${prefix}${sequence}`;
  } catch (error) {
    console.error("Error generating credit note number:", error);
    const year = new Date().getFullYear().toString().slice(-2);
    return `CN-${year}-${Date.now().toString().slice(-6)}`;
  }
};

// Create new credit note - UPDATED
exports.createCreditNote = async (req, res) => {
  try {
    // Parse request data (handles both JSON and FormData)
    let creditNoteData = req.body;
    
    // If it's FormData with tax settings
    if (req.headers['content-type']?.includes('multipart/form-data') || 
        Object.keys(req.body).some(key => key.includes('['))) {
      creditNoteData = parseFormDataNested(req.body);
    }

    // Generate credit note number
    const creditNoteNumber = await generateCreditNoteNumber();

    // IMPORTANT: Ensure taxSettings has autoRoundOff (from your model)
    const taxSettings = creditNoteData.taxSettings || {
      enableGSTBilling: true,
      priceIncludeGST: true,
      autoRoundOff: "0", // MUST ADD THIS
      defaultGSTRate: "18"
    };

    // Validate required fields
    if (!creditNoteData.customerId) {
      return res.status(400).json({
        success: false,
        error: "Customer ID is required"
      });
    }

    if (!creditNoteData.items || creditNoteData.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one item is required"
      });
    }

    // Validate customer exists
    const customer = await Customer.findById(creditNoteData.customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found"
      });
    }

    // Create credit note
    const creditNote = new CreditNote({
      ...creditNoteData,
      creditNoteNumber,
      taxSettings, // Include tax settings
      createdBy: req.user?._id || req.user._id,
    });

    // Calculate totals (this will run pre-save middleware)
    creditNote.calculateTotals();

    const savedCreditNote = await creditNote.save();

    // Update customer's due amount if credit note is issued
    if (creditNoteData.status === "issued" && creditNoteData.customerId) {
      await Customer.findByIdAndUpdate(creditNoteData.customerId, {
        $inc: { 
          totalDueAmount: -savedCreditNote.totalAmount,
          // Also update credit note statistics
          totalCreditNotes: 1,
          totalCreditAmount: savedCreditNote.totalAmount
        }
      });

      // Update invoice if linked
      if (creditNoteData.invoiceId) {
        const invoice = await Invoice.findById(creditNoteData.invoiceId);
        if (invoice) {
          // Add to invoice's credit notes array
          invoice.creditNotes = invoice.creditNotes || [];
          invoice.creditNotes.push({
            creditNoteId: savedCreditNote._id,
            amount: savedCreditNote.totalAmount,
            date: new Date(),
          });

          // Recalculate invoice due amount
          invoice.calculateTotals();
          await invoice.save();
        }
      }
    }

    // Populate for response
    const populatedCreditNote = await CreditNote.findById(savedCreditNote._id)
      .populate("customerId", "name email phone")
      .populate("invoiceId", "invoiceNo invoiceDate")
      .populate("createdBy", "firstName lastName");

    res.status(201).json({
      success: true,
      message: `Credit note ${creditNoteData.status === "issued" ? "issued" : "saved as draft"} successfully`,
      creditNote: populatedCreditNote
    });

  } catch (error) {
    console.error("Create credit note error:", error);
    
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: Object.values(err.errors).map((e) => e.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Credit note number already exists"
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message
    });
  }
};

// Apply credit note to invoice - UPDATED
exports.applyCreditNote = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const creditNote = await CreditNote.findById(req.params.id);

    if (!creditNote) {
      return res.status(404).json({
        success: false,
        error: "Credit note not found"
      });
    }
    
    if (creditNote.status !== "issued") {
      return res.status(400).json({
        success: false,
        error: "Only issued credit notes can be applied"
      });
    }

    // Update invoice with credit note
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found"
      });
    }

    // Check if credit note belongs to this invoice
    if (creditNote.invoiceId && creditNote.invoiceId.toString() !== invoiceId) {
      return res.status(400).json({
        success: false,
        error: "Credit note does not belong to this invoice"
      });
    }

    // Add to invoice's credit notes
    invoice.creditNotes = invoice.creditNotes || [];
    invoice.creditNotes.push({
      creditNoteId: creditNote._id,
      amount: creditNote.totalAmount,
      date: new Date(),
      appliedBy: req.user?._id
    });

    // Recalculate invoice totals
    invoice.calculateTotals();
    await invoice.save();

    // Update credit note status
    creditNote.status = "applied";
    creditNote.appliedToInvoice = invoiceId;
    creditNote.appliedDate = new Date();
    await creditNote.save();

    // Update customer balance
    await Customer.findByIdAndUpdate(creditNote.customerId, {
      $inc: { 
        totalDueAmount: -creditNote.totalAmount,
        settledCreditAmount: creditNote.totalAmount
      }
    });

    res.json({
      success: true,
      message: "Credit note applied successfully",
      creditNote,
      invoice: {
        _id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        newDueAmount: invoice.dueAmount,
        creditApplied: creditNote.totalAmount
      }
    });

  } catch (error) {
    console.error("Apply credit note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to apply credit note",
      message: error.message
    });
  }
};


// Get all credit notes
// exports.getAllCreditNotes = async (req, res) => {
//   try {
//     const creditNotes = await CreditNote.find()
//       .populate("customerId", "name email phone")
//       .populate("invoiceId", "invoiceNumber")
//       .populate({
//         path: "createdBy",
//         select: "firstName lastName email username role",
//         populate: {
//           path: "role",
//           select: "roleName",
//         }
//       })
//       .sort({ date: -1 });
//     res.json(creditNotes);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// Get all credit notes - UPDATED with better response format
exports.getAllCreditNotes = async (req, res) => {
  try {
    const {
      customerId,
      status,
      startDate,
      endDate,
      search,
    } = req.query;

    const filter = {};

    // Customer filter
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      filter.customerId = customerId;
    }

    // Status filter
    if (status && status !== "all") {
      const validStatuses = ["draft", "issued", "applied", "cancelled"];
      if (validStatuses.includes(status)) {
        filter.status = status;
      }
    }

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { creditNoteNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } }
      ];
    }
    const creditNotes = await CreditNote.find(filter)
      .populate("customerId", "name email phone")
      .populate("invoiceId", "invoiceNo invoiceDate")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })

    const total = await CreditNote.countDocuments(filter);

    res.json({
      success: true,
      count: creditNotes.length,
      total,
      creditNotes
    });

  } catch (error) {
    console.error("Get credit notes error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch credit notes"
    });
  }
};

// Get credit note by ID
// exports.getCreditNoteById = async (req, res) => {
//   try {
//     const creditNote = await CreditNote.findById(req.params.id)
//       .populate("customerId", "name email phone address gstin")
//       .populate("invoiceId", "invoiceNo invoiceDate grandTotal")
//       .populate("createdBy", "firstName lastName")
//       .populate("items.productId", "productName hsnCode unit");

//     if (!creditNote) {
//       return res.status(404).json({
//         success: false,
//         error: "Credit note not found"
//       });
//     }

//     res.json({
//       success: true,
//       creditNote
//     });
//   } catch (error) {
//     console.error("Get credit note by ID error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to fetch credit note"
//     });
//   }
// };

exports.getCreditNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid credit note ID"
      });
    }

    const creditNote = await CreditNote.findById(id)
      .populate("customerId", "name email phone address gstin")
      .populate("invoiceId", "invoiceNo invoiceDate grandTotal")
      .populate("createdBy", "firstName lastName")
      .populate("items.productId", "productName hsnCode unit");

    if (!creditNote) {
      return res.status(404).json({
        success: false,
        error: "Credit note not found"
      });
    }

    res.json({ success: true, creditNote });

  } catch (error) {
    console.error("Get credit note by ID error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch credit note"
    });
  }
};


// Create new credit note
exports.createCreditNote = async (req, res) => {
  try {
    const creditNoteNumber = await generateCreditNoteNumber();

    const creditNote = new CreditNote({
      ...req.body,
      creditNoteNumber,
      createdBy: req.user._id,
    });

    const savedCreditNote = await creditNote.save();

    // Update customer's due amount if credit note is issued
    if (req.body.status === "issued" && req.body.customerId) {
      await Customer.findByIdAndUpdate(req.body.customerId, {
        $inc: { totalDueAmount: -req.body.totalAmount },
      });
    }

    res.status(201).json(savedCreditNote);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Apply credit note to invoice
exports.applyCreditNote = async (req, res) => {
  try {
    const { invoiceId } = req.body;
    const creditNote = await CreditNote.findById(req.params.id);

    if (!creditNote)
      return res.status(404).json({ message: "Credit note not found" });
    if (creditNote.status !== "issued") {
      return res
        .status(400)
        .json({ message: "Only issued credit notes can be applied" });
    }

    // Update invoice with credit note
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    invoice.creditNotes = invoice.creditNotes || [];
    invoice.creditNotes.push({
      creditNoteId: creditNote._id,
      amount: creditNote.totalAmount,
      date: new Date(),
    });

    invoice.totalDue = Math.max(0, invoice.totalDue - creditNote.totalAmount);

    // Update credit note status
    creditNote.status = "applied";
    creditNote.appliedToInvoice = invoiceId;
    creditNote.appliedDate = new Date();

    await Promise.all([invoice.save(), creditNote.save()]);

    res.json({
      message: "Credit note applied successfully",
      creditNote,
      invoice,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update credit note
// exports.updateCreditNote = async (req, res) => {
//   try {
//     const creditNote = await CreditNote.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true, runValidators: true },
//     );
//     res.json(creditNote);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

exports.updateCreditNote = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid credit note ID"
      });
    }

    const creditNote = await CreditNote.findById(req.params.id);
    if (!creditNote) {
      return res.status(404).json({
        success: false,
        error: "Credit note not found"
      });
    }

    // Parse update data
    let updateData = req.body;
    if (Object.keys(req.body).some(key => key.includes('['))) {
      updateData = parseFormDataNested(req.body);
    }

    const oldStatus = creditNote.status;
    const oldTotalAmount = creditNote.totalAmount || 0;

    // Update fields
    const updatableFields = [
      "items",
      "reason",
      "reasonDescription",
      "additionalCharges",
      "additionalChargesDetails",
      "shoppingPointsUsed",
      "notes",
      "status"
    ];

    updatableFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        creditNote[field] = updateData[field];
      }
    });

    // Update tax settings if provided
    if (updateData.taxSettings) {
      creditNote.taxSettings = {
        enableGSTBilling: updateData.taxSettings.enableGSTBilling !== false,
        priceIncludeGST: updateData.taxSettings.priceIncludeGST !== false,
        autoRoundOff: updateData.taxSettings.autoRoundOff || "0", // IMPORTANT
        defaultGSTRate: updateData.taxSettings.defaultGSTRate || "18"
      };
    }

    // Recalculate and save
    creditNote.calculateTotals();
    await creditNote.save();

    // Update customer due amount if status changed
    if (oldStatus !== creditNote.status || oldTotalAmount !== creditNote.totalAmount) {
      const customer = await Customer.findById(creditNote.customerId);
      if (customer) {
        let adjustment = 0;
        
        if (oldStatus === "issued" && creditNote.status !== "issued") {
          // Was issued, now not issued - add back the old amount
          adjustment = oldTotalAmount;
        } else if (oldStatus !== "issued" && creditNote.status === "issued") {
          // Wasn't issued, now issued - subtract new amount
          adjustment = -creditNote.totalAmount;
        } else if (creditNote.status === "issued") {
          // Still issued, but amount changed
          adjustment = oldTotalAmount - creditNote.totalAmount;
        }

        if (adjustment !== 0) {
          customer.totalDueAmount += adjustment;
          await customer.save();
        }
      }
    }

    const populatedCreditNote = await CreditNote.findById(creditNote._id)
      .populate("customerId", "name phone email")
      .populate("invoiceId", "invoiceNo");

    res.json({
      success: true,
      message: "Credit note updated successfully",
      creditNote: populatedCreditNote
    });

  } catch (error) {
    console.error("Update credit note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update credit note",
      message: error.message
    });
  }
};

// Delete credit note
// exports.deleteCreditNote = async (req, res) => {
//   try {
//     const creditNote = await CreditNote.findById(req.params.id);

//     if (creditNote.status === "applied") {
//       return res
//         .status(400)
//         .json({ message: "Cannot delete applied credit note" });
//     }

//     // Revert customer due amount if credit note was issued
//     if (creditNote.status === "issued" && creditNote.customerId) {
//       await Customer.findByIdAndUpdate(creditNote.customerId, {
//         $inc: { totalDueAmount: creditNote.totalAmount },
//       });
//     }

//     await creditNote.deleteOne();
//     res.json({ message: "Credit note deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

exports.deleteCreditNote = async (req, res) => {
  try {
    const creditNote = await CreditNote.findById(req.params.id);

    if (!creditNote) {
      return res.status(404).json({
        success: false,
        error: "Credit note not found"
      });
    }

    if (creditNote.status === "applied") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete applied credit note. Cancel it first."
      });
    }

    const oldStatus = creditNote.status;
    const oldAmount = creditNote.totalAmount;

    // Revert customer due amount if credit note was issued
    if (oldStatus === "issued" && creditNote.customerId) {
      await Customer.findByIdAndUpdate(creditNote.customerId, {
        $inc: { totalDueAmount: oldAmount }
      });
    }

    // Remove from invoice if linked
    if (creditNote.invoiceId) {
      const invoice = await Invoice.findById(creditNote.invoiceId);
      if (invoice && invoice.creditNotes) {
        invoice.creditNotes = invoice.creditNotes.filter(
          cn => cn.creditNoteId.toString() !== creditNote._id.toString()
        );
        invoice.calculateTotals();
        await invoice.save();
      }
    }

    await creditNote.deleteOne();

    res.json({
      success: true,
      message: "Credit note deleted successfully",
      deletedId: req.params.id
    });
  } catch (error) {
    console.error("Delete credit note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete credit note",
      message: error.message
    });
  }
};


// Get credit notes by customer
exports.getCreditNotesByCustomer = async (req, res) => {
  try {
    const creditNotes = await CreditNote.find({
      customerId: req.params.customerId,
    }).sort({ date: -1 });
    res.json({
      success:true,
      count:creditNotes.length,
      creditNotes,
    });
  } catch (error) {
    console.error("Get credit notes by customer error:", error);
    res.status(500).json({success:false,  message: error.message });
  }
};

// Get credit notes by status
exports.getCreditNotesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["draft", "issued", "applied", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const creditNotes = await CreditNote.find({ status })
      .populate("customerId", "name")
      .sort({ date: -1 });

    res.json(creditNotes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get credit notes summary (for dashboard)
exports.getCreditNotesSummary = async (req, res) => {
  try {
    const [totalCount, issuedCount, appliedCount, totalAmount] =
      await Promise.all([
        CreditNote.countDocuments(),
        CreditNote.countDocuments({ status: "issued" }),
        CreditNote.countDocuments({ status: "applied" }),
        CreditNote.aggregate([
          { $match: { status: { $in: ["issued", "applied"] } } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
      ]);

    res.json({
      totalCount,
      issuedCount,
      appliedCount,
      draftCount: totalCount - issuedCount - appliedCount,
      totalAmount: totalAmount[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search credit notes
exports.searchCreditNotes = async (req, res) => {
  try {
    const { query, startDate, endDate, status } = req.query;

    let searchCriteria = {};

    // Text search
    if (query) {
      searchCriteria.$or = [
        { creditNoteNumber: { $regex: query, $options: "i" } },
        { customerName: { $regex: query, $options: "i" } },
        { "customerId.name": { $regex: query, $options: "i" } },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      searchCriteria.date = {};
      if (startDate) searchCriteria.date.$gte = new Date(startDate);
      if (endDate) searchCriteria.date.$lte = new Date(endDate);
    }

    // Status filter
    if (status && status !== "all") {
      searchCriteria.status = status;
    }

    const creditNotes = await CreditNote.find(searchCriteria)
      .populate("customerId", "name email phone")
      .sort({ date: -1 });

    res.json(creditNotes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Cancel credit note
// exports.cancelCreditNote = async (req, res) => {
//   try {
//     const creditNote = await CreditNote.findById(req.params.id);

//     if (!creditNote) {
//       return res.status(404).json({ message: "Credit note not found" });
//     }

//     if (creditNote.status === "applied") {
//       return res
//         .status(400)
//         .json({ message: "Cannot cancel an applied credit note" });
//     }

//     if (creditNote.status === "cancelled") {
//       return res
//         .status(400)
//         .json({ message: "Credit note is already cancelled" });
//     }

//     // Revert customer due amount if credit note was issued
//     if (creditNote.status === "issued" && creditNote.customerId) {
//       await Customer.findByIdAndUpdate(creditNote.customerId, {
//         $inc: { totalDueAmount: creditNote.totalAmount },
//       });
//     }

//     creditNote.status = "cancelled";
//     creditNote.cancelledAt = new Date();
//     await creditNote.save();

//     res.json({ message: "Credit note cancelled successfully", creditNote });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// Fix the cancel credit note function
exports.cancelCreditNote = async (req, res) => {
  try {
    const creditNote = await CreditNote.findById(req.params.id);

    if (!creditNote) {
      return res.status(404).json({
        success: false,
        error: "Credit note not found"
      });
    }

    if (creditNote.status === "applied") {
      return res.status(400).json({
        success: false,
        error: "Cannot cancel an applied credit note"
      });
    }

    if (creditNote.status === "cancelled") {
      return res.status(400).json({
        success: false,
        error: "Credit note is already cancelled"
      });
    }

    const oldStatus = creditNote.status;
    const oldAmount = creditNote.totalAmount;

    // Revert customer due amount if credit note was issued
    if (oldStatus === "issued" && creditNote.customerId) {
      await Customer.findByIdAndUpdate(creditNote.customerId, {
        $inc: { totalDueAmount: oldAmount }
      });

      // Also remove from invoice if linked
      if (creditNote.invoiceId) {
        const invoice = await Invoice.findById(creditNote.invoiceId);
        if (invoice && invoice.creditNotes) {
          invoice.creditNotes = invoice.creditNotes.filter(
            cn => cn.creditNoteId.toString() !== creditNote._id.toString()
          );
          invoice.calculateTotals();
          await invoice.save();
        }
      }
    }

    creditNote.status = "cancelled";
    creditNote.cancelledAt = new Date();
    await creditNote.save();

    res.json({
      success: true,
      message: "Credit note cancelled successfully",
      creditNote
    });
  } catch (error) {
    console.error("Cancel credit note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel credit note",
      message: error.message
    });
  }
};

// Get recent credit notes
exports.getRecentCreditNotes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const creditNotes = await CreditNote.find()
      .populate("customerId", "name")
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(creditNotes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update credit note status (for approve/reject from frontend)
exports.updateCreditNoteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const creditNote = await CreditNote.findById(req.params.id);

    if (!creditNote) {
      return res.status(404).json({
        success: false,
        error: "Credit note not found",
      });
    }

    const currentStatus = creditNote.status;

    // Check if can be updated (only "issued" can be changed)
    if (currentStatus !== "issued") {
      return res.status(400).json({
        success: false,
        error: `Only credit notes with "issued" status can be updated. Current status: ${currentStatus}`,
        allowedStatus: "issued",
      });
    }

    // Only allow to "settled" or "cancelled"
    // Note: For credit notes, "settled" might not exist. Use "applied" instead
    if (!["applied", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Can only update to "applied" or "cancelled"`,
        allowedTransitions: ["applied", "cancelled"],
      });
    }

    // Store old amount for customer balance calculation
    const oldAmount = creditNote.totalAmount;

    // Update customer's balance
    if (status === "cancelled") {
      // Revert customer due amount (since it was reduced when issued)
      await Customer.findByIdAndUpdate(creditNote.customerId, {
        $inc: { totalDueAmount: oldAmount }, // Add back to due amount
      });
    }

    // If status is "applied", the balance was already reduced when issued
    // and doesn't need further adjustment

    // Update status
    creditNote.status = status;

    // Set applied date if status is "applied"
    if (status === "applied") {
      creditNote.appliedDate = new Date();
    }

    await creditNote.save();

    res.json({
      success: true,
      message: `Credit note ${status === "applied" ? "approved" : "rejected"} successfully`,
      creditNote,
    });
  } catch (error) {
    console.error("Update credit note status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update credit note status",
    });
  }
};

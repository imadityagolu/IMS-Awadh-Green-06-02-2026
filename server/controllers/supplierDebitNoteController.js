const SupplierDebitNote = require("../models/SupplierDebitNoteModal");
const Supplier = require("../models/supplierModel");
const mongoose = require("mongoose");

// Get all debit notes
exports.getAllDebitNotes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "date",
      sortOrder = "desc",
      status,
      supplierId,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (status && status !== "all") query.status = status;
    if (supplierId) query.supplierId = supplierId;

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [debitNotes, totalCount] = await Promise.all([
      SupplierDebitNote.find(query)
        .populate("supplierId", "name company phone email gstin")
        .populate("invoiceId", "invoiceNumber")
        .populate("items.productId", "productName sku hsnCode")
        .populate({
        path: "createdBy",
          select: "firstName lastName email username role",
          populate: {
            path: "role",
            select: "roleName",
          }
        }).sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SupplierDebitNote.countDocuments(query),
    ]);

    res.json({
      success: true,
      debitNotes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Get all debit notes error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch debit notes",
    });
  }
};

// Get debit note by ID
exports.getDebitNoteById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid debit note ID format",
      });
    }

    const debitNote = await SupplierDebitNote.findById(req.params.id)
      .populate("supplierId")
      .populate("invoiceId")
      .populate("items.productId", "productName sku hsnCode unit")
      .populate("createdBy", "firstName lastName email role");

    if (!debitNote) {
      return res.status(404).json({
        success: false,
        error: "Debit note not found",
      });
    }

    res.json({
      success: true,
      debitNote,
    });
  } catch (error) {
    console.error("Get debit note by ID error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch debit note",
    });
  }
};

// Create new debit note
exports.createDebitNote = async (req, res) => {
  try {
    console.log("Debit Note create request");
    console.log("Request body", JSON.stringify(req.body, null, 2));
    console.log("user from request", req.user);
    console.log("user ID", req.user ? req.user?._id : "Null");
    console.log("User Role", req.user ? req.user?.role : "Null");
    if (!req.user) {
      console.error("Error: No User found in request");
      return res.status(401).json({
        success: false,
        error: "Unauthorized: No user information found",
      });
    }
    const debitNoteNumber = await SupplierDebitNote.generateDebitNoteNumber();
    console.log("Generated Debit Note Number:", debitNoteNumber);

    // Get supplier details
    const supplier = await Supplier.findById(req.body.supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }
    console.log("Supplier details fetched:", supplier.supplierName);

    const debitNoteData = {
      ...req.body,
      debitNoteNumber,
      supplierName: supplier.supplierName || supplier.name || supplier.company,
      phone: req.body.phone || supplier.phone,
      email: req.body.email || supplier.email,
      address: req.body.address || supplier.address,
      createdBy: req.user._id,
    };
    console.log(
      "Debit Note data to save:",
      JSON.stringify(debitNoteData, null, 2),
    );
    const debitNote = new SupplierDebitNote(debitNoteData);
    const savedDebitNote = await debitNote.save();
    console.log("Debit note save successful:", savedDebitNote._id);

    // Update supplier's payable amount if debit note is issued
    if (req.body.status === "issued" && req.body.supplierId) {
      await Supplier.findByIdAndUpdate(req.body.supplierId, {
        $inc: {
          totalPayable: req.body.totalAmount, // Increases payable amount
          creditBalance: req.body.totalAmount, // Credit balance increases
        },
        $push: {
          debitNotes: {
            debitNoteId: savedDebitNote._id,
            amount: req.body.totalAmount,
            date: new Date(),
          },
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Debit note created successfully",
      debitNote: savedDebitNote,
    });
  } catch (error) {
    console.error("Create debit note error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Duplicate debit note number",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create debit note",
    });
  }
};

// Update debit note
// Update debit note - FIXED VERSION
// Update debit note - FIXED to handle partial updates
exports.updateDebitNote = async (req, res) => {
  try {
    const debitNote = await SupplierDebitNote.findById(req.params.id);

    if (!debitNote) {
      return res.status(404).json({
        success: false,
        error: "Debit note not found",
      });
    }

    // Check if debit note can be updated
    if (debitNote.status === "settled") {
      return res.status(400).json({
        success: false,
        error: "Cannot update a settled debit note",
      });
    }

    if (debitNote.status === "cancelled") {
      return res.status(400).json({
        success: false,
        error: "Cannot update a cancelled debit note",
      });
    }

    // Store old amount for supplier balance calculation
    const oldAmount = debitNote.totalAmount;
    const oldStatus = debitNote.status;

    // Calculate new totals if items are being updated
    if (req.body.items) {
      // Calculate new subtotal, discount, and total
      let newSubtotal = 0;
      let newTotalDiscount = 0;
      let newTotalTax = 0;

      req.body.items.forEach((item) => {
        const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
        newSubtotal += itemSubtotal;

        let discountAmount = item.discountAmount || 0;
        if (item.discountPercent > 0) {
          discountAmount = itemSubtotal * (item.discountPercent / 100);
        }
        newTotalDiscount += discountAmount;

        const taxableAmount = Math.max(0, itemSubtotal - discountAmount);
        const taxAmount = taxableAmount * ((item.taxRate || 0) / 100);
        newTotalTax += taxAmount;
      });

      // Add calculated totals to request body
      req.body.subtotal = parseFloat(newSubtotal.toFixed(2));
      req.body.totalDiscount = parseFloat(newTotalDiscount.toFixed(2));
      req.body.totalTax = parseFloat(newTotalTax.toFixed(2));
      req.body.totalAmount = parseFloat(
        (
          newSubtotal +
          newTotalTax -
          newTotalDiscount +
          (req.body.additionalCharges || 0) +
          (req.body.roundOff || 0)
        ).toFixed(2),
      );
    }

    const newAmount = req.body.totalAmount || oldAmount;
    const amountDifference = newAmount - oldAmount;
    const newStatus = req.body.status || oldStatus;

    // Handle supplier balance adjustments
    // Only adjust if status changes between issued and non-issued
    if (oldStatus !== newStatus) {
      if (oldStatus === "issued" && newStatus !== "issued") {
        // Removing issued debit note
        await Supplier.findByIdAndUpdate(debitNote.supplierId, {
          $inc: {
            totalPayable: -oldAmount,
            creditBalance: -oldAmount,
          },
        });
      } else if (newStatus === "issued" && oldStatus !== "issued") {
        // Adding new issued debit note
        await Supplier.findByIdAndUpdate(debitNote.supplierId, {
          $inc: {
            totalPayable: newAmount,
            creditBalance: newAmount,
          },
        });
      }
    } else if (oldStatus === "issued" && amountDifference !== 0) {
      // Amount changed for issued debit note
      await Supplier.findByIdAndUpdate(debitNote.supplierId, {
        $inc: {
          totalPayable: amountDifference,
          creditBalance: amountDifference,
        },
      });
    }

    const updatedDebitNote = await SupplierDebitNote.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    )
      .populate("supplierId", "name company phone email gstin")
      .populate("invoiceId", "invoiceNumber")
      .populate("items.productId", "productName sku hsnCode");

    res.json({
      success: true,
      message: "Debit note updated successfully",
      debitNote: updatedDebitNote,
    });
  } catch (error) {
    console.error("Update debit note error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update debit note",
    });
  }
};

// Delete debit note
exports.deleteDebitNote = async (req, res) => {
  try {
    const debitNote = await SupplierDebitNote.findById(req.params.id);

    if (!debitNote) {
      return res.status(404).json({
        success: false,
        error: "Debit note not found",
      });
    }

    if (debitNote.status === "settled") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete a settled debit note",
      });
    }

    // Revert supplier payable amount if debit note was issued
    if (debitNote.status === "issued" && debitNote.supplierId) {
      await Supplier.findByIdAndUpdate(debitNote.supplierId, {
        $inc: {
          totalPayable: -debitNote.totalAmount,
          creditBalance: -debitNote.totalAmount,
        },
      });
    }

    await debitNote.deleteOne();

    res.json({
      success: true,
      message: "Debit note deleted successfully",
    });
  } catch (error) {
    console.error("Delete debit note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete debit note",
    });
  }
};

// Get debit notes by supplier
exports.getDebitNotesBySupplier = async (req, res) => {
  try {
    const debitNotes = await SupplierDebitNote.find({
      supplierId: req.params.supplierId,
    })
      .populate("invoiceId", "invoiceNumber date")
      .sort({ date: -1 });

    // Calculate summary
    const summary = {
      totalAmount: 0,
      issuedAmount: 0,
      settledAmount: 0,
      draftAmount: 0,
    };

    debitNotes.forEach((dn) => {
      summary.totalAmount += dn.totalAmount;
      if (dn.status === "issued") summary.issuedAmount += dn.totalAmount;
      if (dn.status === "settled") summary.settledAmount += dn.totalAmount;
      if (dn.status === "draft") summary.draftAmount += dn.totalAmount;
    });

    res.json({
      success: true,
      debitNotes,
      summary,
    });
  } catch (error) {
    console.error("Get debit notes by supplier error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch debit notes",
    });
  }
};

// Get debit notes by status
exports.getDebitNotesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["draft", "issued", "settled", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const debitNotes = await SupplierDebitNote.find({ status })
      .populate("supplierId", "name company")
      .sort({ date: -1 });

    res.json({
      success: true,
      debitNotes,
    });
  } catch (error) {
    console.error("Get debit notes by status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch debit notes",
    });
  }
};

// Search debit notes
exports.searchDebitNotes = async (req, res) => {
  try {
    const {
      query,
      startDate,
      endDate,
      status,
      supplierId,
      reason,
      minAmount,
      maxAmount,
    } = req.query;

    let searchCriteria = {};

    // Text search
    if (query) {
      searchCriteria.$or = [
        { debitNoteNumber: { $regex: query, $options: "i" } },
        { supplierName: { $regex: query, $options: "i" } },
        { purchaseOrderNo: { $regex: query, $options: "i" } },
        { grnNo: { $regex: query, $options: "i" } },
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

    // Supplier filter
    if (supplierId) {
      searchCriteria.supplierId = supplierId;
    }

    // Reason filter
    if (reason && reason !== "all") {
      searchCriteria.reason = reason;
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      searchCriteria.totalAmount = {};
      if (minAmount) searchCriteria.totalAmount.$gte = parseFloat(minAmount);
      if (maxAmount) searchCriteria.totalAmount.$lte = parseFloat(maxAmount);
    }

    const debitNotes = await SupplierDebitNote.find(searchCriteria)
      .populate("supplierId", "name email phone company")
      .sort({ date: -1 });

    res.json({
      success: true,
      debitNotes,
      count: debitNotes.length,
    });
  } catch (error) {
    console.error("Search debit notes error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search debit notes",
    });
  }
};

// Cancel debit note
exports.cancelDebitNote = async (req, res) => {
  try {
    const debitNote = await SupplierDebitNote.findById(req.params.id);

    if (!debitNote) {
      return res.status(404).json({
        success: false,
        error: "Debit note not found",
      });
    }

    if (debitNote.status === "settled") {
      return res.status(400).json({
        success: false,
        error: "Cannot cancel a settled debit note",
      });
    }

    if (debitNote.status === "cancelled") {
      return res.status(400).json({
        success: false,
        error: "Debit note is already cancelled",
      });
    }

    // Revert supplier payable amount if debit note was issued
    if (debitNote.status === "issued" && debitNote.supplierId) {
      await Supplier.findByIdAndUpdate(debitNote.supplierId, {
        $inc: {
          totalPayable: -debitNote.totalAmount,
          creditBalance: -debitNote.totalAmount,
        },
      });
    }

    debitNote.status = "cancelled";
    await debitNote.save();

    res.json({
      success: true,
      message: "Debit note cancelled successfully",
      debitNote,
    });
  } catch (error) {
    console.error("Cancel debit note error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel debit note",
    });
  }
};

// Mark debit note as settled
exports.markAsSettled = async (req, res) => {
  try {
    const debitNote = await SupplierDebitNote.findById(req.params.id);

    if (!debitNote) {
      return res.status(404).json({
        success: false,
        error: "Debit note not found",
      });
    }

    if (debitNote.status !== "issued") {
      return res.status(400).json({
        success: false,
        error: "Only issued debit notes can be marked as settled",
      });
    }

    // Update supplier's payable amount
    await Supplier.findByIdAndUpdate(debitNote.supplierId, {
      $inc: {
        totalPayable: -debitNote.totalAmount,
        creditBalance: -debitNote.totalAmount,
      },
    });

    debitNote.status = "settled";
    debitNote.settledDate = new Date();
    await debitNote.save();

    res.json({
      success: true,
      message: "Debit note marked as settled successfully",
      debitNote,
    });
  } catch (error) {
    console.error("Mark as settled error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark debit note as settled",
    });
  }
};

// Get recent debit notes
exports.getRecentDebitNotes = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const debitNotes = await SupplierDebitNote.find()
      .populate("supplierId", "name company")
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      debitNotes,
    });
  } catch (error) {
    console.error("Get recent debit notes error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent debit notes",
    });
  }
};

// Get debit notes summary
exports.getDebitNotesSummary = async (req, res) => {
  try {
    const { startDate, endDate, supplierId } = req.query;

    const matchStage = {};

    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    if (supplierId) {
      matchStage.supplierId = new mongoose.Types.ObjectId(supplierId);
    }

    const summary = await SupplierDebitNote.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalStats = {
      totalCount: summary.reduce((sum, item) => sum + item.count, 0),
      totalAmount: summary.reduce((sum, item) => sum + item.totalAmount, 0),
      byStatus: summary.reduce((acc, item) => {
        acc[item._id] = { count: item.count, amount: item.totalAmount };
        return acc;
      }, {}),
    };

    res.json({
      success: true,
      summary: totalStats,
    });
  } catch (error) {
    console.error("Get debit notes summary error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch debit notes summary",
    });
  }
};

// Get debit notes by purchase order
exports.getDebitNotesByPurchaseOrder = async (req, res) => {
  try {
    const debitNotes = await SupplierDebitNote.find({
      purchaseOrderNo: req.params.poNumber,
    })
      .populate("supplierId", "name company")
      .sort({ date: -1 });

    res.json({
      success: true,
      debitNotes,
    });
  } catch (error) {
    console.error("Get debit notes by purchase order error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch debit notes",
    });
  }
};

// Add this function at the end of the file, before the last closing brace
exports.updateDebitNoteStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const debitNote = await SupplierDebitNote.findById(req.params.id);

    if (!debitNote) {
      return res.status(404).json({
        success: false,
        error: "Debit note not found",
      });
    }

    const currentStatus = debitNote.status;

    // Check if can be updated (only "issued" can be changed)
    if (currentStatus !== "issued") {
      return res.status(400).json({
        success: false,
        error: `Only debit notes with "issued" status can be updated. Current status: ${currentStatus}`,
        allowedStatus: "issued",
      });
    }

    // Only allow to "settled" or "cancelled"
    if (!["settled", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Can only update to "settled" or "cancelled"`,
        allowedTransitions: ["settled", "cancelled"],
      });
    }

    // Store old amount
    const oldAmount = debitNote.totalAmount;

    // Revert supplier balance (since it was added when issued)
    await Supplier.findByIdAndUpdate(debitNote.supplierId, {
      $inc: {
        totalPayable: -oldAmount,
        creditBalance: -oldAmount,
      },
    });

    // Update status
    debitNote.status = status;

    // Set settled date if approved
    if (status === "settled") {
      debitNote.settledDate = new Date();
    }

    await debitNote.save();

    res.json({
      success: true,
      message: `Debit note ${status === "settled" ? "approved" : "rejected"} successfully`,
      debitNote,
    });
  } catch (error) {
    console.error("Update debit note status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update debit note status",
    });
  }
};

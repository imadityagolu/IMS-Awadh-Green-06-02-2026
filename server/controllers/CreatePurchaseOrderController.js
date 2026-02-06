const Invoice = require("../models/CreatePurchaseOrderModel");
const Supplier = require("../models/supplierModel");
const Product = require("../models/productModels");
const cloudinary = require("../utils/cloudinary/cloudinary");
const mongoose = require("mongoose");

// Helper: Generate unique invoice number for supplier
const generateInvoiceNo = async () => {
  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0"); // Add day for more uniqueness

    // Use a more specific prefix that includes day
    const prefix = `INV${year}${month}${day}`;

    // Find the last invoice number with this prefix
    const lastInvoice = await Invoice.findOne(
      { invoiceNo: { $regex: `^${prefix}` } },
      { invoiceNo: 1 }
    )
      .sort({ createdAt: -1 })
      .lean();

    let sequence = "001"; // Default sequence

    if (lastInvoice && lastInvoice.invoiceNo) {
      // Extract the numeric part (last 3 digits)
      const lastSequence = lastInvoice.invoiceNo.slice(-3);
      const nextSequence = parseInt(lastSequence, 10) + 1;
      sequence = String(nextSequence).padStart(3, "0");
    }

    const invoiceNo = `${prefix}${sequence}`;

    // Double-check if this invoice number already exists
    const existing = await Invoice.findOne({ invoiceNo });
    if (existing) {
      // If duplicate, try again with incremented sequence
      const retrySequence = parseInt(sequence, 10) + 1;
      return `${prefix}${String(retrySequence).padStart(3, "0")}`;
    }

    return invoiceNo;
  } catch (error) {
    // console.error("Error generating invoice number:", error);
    // Fallback to timestamp-based ID
    return `INV${Date.now()}`;
  }
};

// Helper: Parse FormData nested objects (same as customer)
const parseFormDataNested = (body) => {
  const parsed = { ...body };

  // Parse additionalDiscount
  if (
    body["additionalDiscount[pct]"] !== undefined ||
    body["additionalDiscount[amt]"] !== undefined
  ) {
    parsed.additionalDiscount = {
      pct: parseFloat(body["additionalDiscount[pct]"]) || 0,
      amt: parseFloat(body["additionalDiscount[amt]"]) || 0,
    };
  }

  // Parse additionalChargesDetails
  parsed.additionalChargesDetails = {
    shipping: parseFloat(body["additionalChargesDetails[shipping]"]) || 0,
    handling: parseFloat(body["additionalChargesDetails[handling]"]) || 0,
    packing: parseFloat(body["additionalChargesDetails[packing]"]) || 0,
    service: parseFloat(body["additionalChargesDetails[service]"]) || 0,
    other: parseFloat(body["additionalChargesDetails[other]"]) || 0,
  };

  // Parse items array from FormData bracket notation
  const items = [];
  const itemRegex = /items\[(\d+)\]\[(\w+)\]/;

  Object.keys(body).forEach((key) => {
    const match = key.match(itemRegex);
    if (match) {
      const index = parseInt(match[1]);
      const field = match[2];

      if (!items[index]) {
        items[index] = {};
      }

      // Parse numeric fields
      const numericFields = [
        "qty",
        "unitPrice",
        "taxRate",
        "taxAmount",
        "discountPct",
        "discountAmt",
        "amount",
      ];
      if (numericFields.includes(field)) {
        items[index][field] = parseFloat(body[key]) || 0;
      } else {
        items[index][field] = body[key];
      }
    }
  });

  if (items.length > 0) {
    parsed.items = items.filter((item) => item !== undefined);
  }

  return parsed;
};

// Create supplier invoice
exports.createInvoice = async (req, res) => {
  try {
    // Parse FormData first
    const parsedBody = parseFormDataNested(req.body);

    // Extract fields
    let {
      supplierId,
      invoiceDate,
      dueDate,
      items = [],
      billingAddress,
      shippingAddress,
      subtotal,
      totalTax,
      totalDiscount,
      additionalDiscount = { pct: 0, amt: 0 },
      additionalCharges,
      additionalChargesDetails = {
        shipping: 0,
        handling: 0,
        packing: 0,
        service: 0,
        other: 0,
      },
      autoRoundOff = false,
      grandTotal,
      paidAmount = 0,
      fullyReceived = false,
      paymentMethod = "cash",
      notes = "",
      termsAndConditions = "",
    } = parsedBody;

    // Validate required fields
    if (!supplierId) {
      return res.status(400).json({
        success: false,
        error: "Supplier ID is required",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one item is required",
      });
    }

    // Validate supplier exists
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    // Validate products and update stock
    const validatedItems = [];
    for (const item of items) {
      if (!item.productId) {
        return res.status(400).json({
          success: false,
          error: "Product ID is required for all items",
        });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Product not found: ${item.productId}`,
        });
      }

      // Use item data from frontend
      const validatedItem = {
        productId: item.productId,
        itemBarcode: item.itemBarcode || product.itemBarcode || "",
        itemName: item.itemName || product.productName,
        hsn: item.hsnCode || product.hsnCode || "",
        qty: parseFloat(item.qty) || 1,
        unit: item.unit || product.unit || "Piece",
        unitPrice: parseFloat(item.unitPrice) || product.purchasePrice || 0, // Use purchase price for supplier
        taxType: item.taxType || product.tax || "GST 0%",
        taxRate:
          parseFloat(item.taxRate) ||
          parseFloat(product.tax?.match(/\d+/)?.[0]) ||
          0,
        taxAmount: parseFloat(item.taxAmount) || 0,
        discountPct: parseFloat(item.discountPct) || 0,
        discountAmt: parseFloat(item.discountAmt) || 0,
        amount: parseFloat(item.amount) || 0,
      };

      validatedItems.push(validatedItem);
    }

    // Generate invoice number
    const invoiceNo = await generateInvoiceNo();

    // Handle file uploads if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "supplier_invoice_attachments",
            resource_type: "auto",
          });

          attachments.push({
            url: result.secure_url,
            public_id: result.public_id,
            filename: file.originalname,
          });
        } catch (uploadError) {
          // console.error("Cloudinary upload error:", uploadError);
        }
      }
    }

    // IMPORTANT: Convert values to numbers
    const calculatedGrandTotal = parseFloat(grandTotal) || 0;
    const calculatedPaidAmount = parseFloat(paidAmount) || 0;

    // Calculate payment amounts - CORRECT LOGIC
    let finalPaidAmount = calculatedPaidAmount;
    let finalDueAmount = Math.max(
      0,
      calculatedGrandTotal - calculatedPaidAmount,
    );
    let finalAdvanceAmount = Math.max(
      0,
      calculatedPaidAmount - calculatedGrandTotal,
    );

    // If fullyReceived is true, then all amount is paid
    if (fullyReceived === true || fullyReceived === "true") {
      finalPaidAmount = calculatedGrandTotal;
      finalDueAmount = 0;
      finalAdvanceAmount = 0;
    }

    // Determine status - CORRECT LOGIC
    let finalStatus = "converted";

    // if (finalPaidAmount >= calculatedGrandTotal) {
    //   finalStatus = "received";
    //   finalDueAmount = 0; // Ensure due amount is 0 when fully paid
    //   finalAdvanceAmount = Math.max(0, finalPaidAmount - calculatedGrandTotal);
    // } else if (finalPaidAmount > 0) {
    //   finalStatus = "partial";
    // }
    // If paidAmount is 0 and not fullyReceived, keep as draft

    // Create invoice
    // Create invoice - WITH CORRECT VALUES
    const invoice = new Invoice({
      supplierId,
      invoiceNo,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      dueDate: dueDate
        ? new Date(dueDate)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      items: validatedItems,
      billingAddress: billingAddress || supplier.address || "",
      shippingAddress:
        shippingAddress || billingAddress || supplier.address || "",
      subtotal: parseFloat(subtotal) || 0,
      totalTax: parseFloat(totalTax) || 0,
      totalDiscount: parseFloat(totalDiscount) || 0,
      additionalDiscount: additionalDiscount,
      additionalCharges: parseFloat(additionalCharges) || 0,
      additionalChargesDetails: additionalChargesDetails,
      autoRoundOff: autoRoundOff === true || autoRoundOff === "true",
      grandTotal: calculatedGrandTotal,
      paidAmount: finalPaidAmount, // Should be 0 if not paid
      dueAmount: finalDueAmount, // Should be grandTotal if not paid
      advanceAmount: finalAdvanceAmount,
      fullyReceived: fullyReceived === true || fullyReceived === "true",
      paymentMethod: paymentMethod,
      status: finalStatus,
      notes: notes,
      termsAndConditions: termsAndConditions,
      attachments: attachments,
      createdBy: req.user?._id,
    });

    // // Calculate round off value if needed
    // if (autoRoundOff) {
    //   const itemsDiscount = validatedItems.reduce(
    //     (sum, item) => sum + (item.discountAmt || 0),
    //     0
    //   );
    //   const additionalDiscountValue =
    //     additionalDiscount.amt +
    //     (subtotal * (additionalDiscount.pct || 0)) / 100;
    //   const totalDiscountCalc = itemsDiscount + additionalDiscountValue;

    //   const totalBeforeRound =
    //     subtotal + totalTax + additionalCharges - totalDiscountCalc;

    //   invoice.roundOffValue = Math.round(totalBeforeRound) - totalBeforeRound;
    // }
    // Calculate round off value if needed
    if (autoRoundOff) {
      // Ensure all values are numbers, default to 0 if undefined/NaN
      const itemsDiscount = validatedItems.reduce(
        (sum, item) => sum + (parseFloat(item.discountAmt) || 0),
        0,
      );

      const additionalDiscountValue =
        (parseFloat(additionalDiscount.amt) || 0) +
        ((parseFloat(subtotal) || 0) *
          (parseFloat(additionalDiscount.pct) || 0)) /
        100;

      const totalDiscountCalc = itemsDiscount + additionalDiscountValue;

      // Convert all values to numbers with fallback to 0
      const subTotalNum = parseFloat(subtotal) || 0;
      const totalTaxNum = parseFloat(totalTax) || 0;
      const additionalChargesNum = parseFloat(additionalCharges) || 0;

      const totalBeforeRound =
        subTotalNum + totalTaxNum + additionalChargesNum - totalDiscountCalc;

      // Check if totalBeforeRound is a valid number before calculating roundOffValue
      if (!isNaN(totalBeforeRound)) {
        invoice.roundOffValue = Math.round(totalBeforeRound) - totalBeforeRound;
      } else {
        invoice.roundOffValue = 0; // Default to 0 if calculation fails
      }
    }

    // Save invoice
    await invoice.save();

    // Update supplier statistics
    // Update supplier statistics
    await Supplier.findByIdAndUpdate(supplierId, {
      $inc: {
        totalInvoices: 1,
        totalPurchaseAmount: calculatedGrandTotal, // Use calculatedGrandTotal
        totalPaidAmount: finalPaidAmount,
        totalDueAmount: finalDueAmount, // ✅ CORRECT: use finalDueAmount
      },
      $set: {
        lastInvoiceDate: new Date(),
        lastPurchaseAmount: calculatedGrandTotal,
      },
    });

    // Update product stock quantities (INCREASE stock for supplier invoice)
    for (const item of validatedItems) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stockQuantity: item.qty },
        });
      }
    }

    // Populate and return response
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate("supplierId", "supplierName phone gstin address")
      .populate(
        "items.productId",
        "productName hsn  images unit purchasePrice tax",
      );

    res.status(201).json({
      success: true,
      message: "Supplier invoice created successfully",
      invoice: populatedInvoice,
    });
  } catch (err) {
    // console.error("Supplier invoice creation error:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: Object.values(err.errors).map((e) => e.message),
      });
    }

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Invoice number already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error",
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// Get all supplier invoices
exports.getAllInvoices = async (req, res) => {
  try {
    const {
      supplierId,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // Filter by supplier
    if (supplierId) {
      if (!mongoose.Types.ObjectId.isValid(supplierId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid supplier ID format",
        });
      }
      filter.supplierId = supplierId;
    }

    // Filter by status
    if (status) {
      const allowedStatuses = [
        "draft",
        "converted",
        "received",
        "partial",
        "cancelled",
        "overdue",
      ];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Allowed values: ${allowedStatuses.join(
            ", ",
          )}`,
        });
      }
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.invoiceDate = {};
      // Date range filter
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.invoiceDate.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.invoiceDate.$lte = end;
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = Invoice.find(filter)
      .select(
        "_id invoiceNo invoiceDate dueDate grandTotal paidAmount dueAmount status items",
      )
      .populate("supplierId", "supplierName  phone email")
      .populate({
        path: "items.productId",
        select: "itemBarcode category productName unit purchasePrice",
        populate: { path: "category", select: "categoryName" }
      })
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Handle search
    if (search) {
      const supplierIds = await Supplier.find({
        supplierName: { $regex: search, $options: "i" },
      }).distinct("_id");

      query = Invoice.find({
        ...filter,
        $or: [
          { invoiceNo: { $regex: search, $options: "i" } },
          { supplierId: { $in: supplierIds } },
        ],
      })
        .populate("supplierId", "supplierName phone email")
        .populate({
          path: "items.productId",
          select: "itemBarcode category productName unit purchasePrice",
          populate: { path: "category", select: "categoryName" }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    }

    const invoices = await query;
    const normalizedInvoices = invoices.map((inv) => {
      const obj = inv.toObject();
      obj.items = (obj.items || []).map((item) => {
        const ib =
          item.itemBarcode ||
          (item.productId && item.productId.itemBarcode) ||
          "";
        return { ...item, itemBarcode: ib };
      });
      return obj;
    });
    const total = await Invoice.countDocuments(filter);

    res.json({
      success: true,
      count: normalizedInvoices.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
      invoices: normalizedInvoices,
    });
  } catch (err) {
    // console.error("Get supplier invoices error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch invoices",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Get single invoice
exports.getInvoiceById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID format",
      });
    }

    const invoice = await Invoice.findById(req.params.id)
      .populate(
        "supplierId",
        "supplierName  phone email address city state country pincode gstin",
      )
      .populate("createdBy", "firstName lastName email")
      .populate(
        "items.productId",
        "productName images hsn  unit purchasePrice tax barcode",
      );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Calculate totals if needed
    if (!invoice.subtotal || !invoice.totalTax || !invoice.grandTotal) {
      invoice.calculateTotals();
      await invoice.save();
    }

    res.json({
      success: true,
      invoice,
      formatted: {
        invoiceDate: invoice.formattedDate,
        dueDate: invoice.formattedDueDate,
      },
    });
  } catch (err) {
    // console.error("Get supplier invoice error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch invoice",
    });
  }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID format",
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Parse FormData if exists
    let updateData = req.body;
    if (
      Object.keys(req.body).some(
        (key) => key.includes("[") && key.includes("]"),
      )
    ) {
      updateData = parseFormDataNested(req.body);
    }

    // If trying to change status field
    if (updateData.status !== undefined) {
      const currentStatus = invoice.status;
      const newStatus = updateData.status;

      // Prevent changing from finalized statuses
      if (["received", "cancelled"].includes(currentStatus)) {
        return res.status(400).json({
          success: false,
          error: `Cannot change status from "${currentStatus}". Status is already finalized.`,
          currentStatus,
          attemptedStatus: newStatus,
        });
      }

      // Only allow specific transitions from "converted"
      if (currentStatus === "converted") {
        if (!["received", "cancelled"].includes(newStatus)) {
          return res.status(400).json({
            success: false,
            error: `Can only change from "converted" to "received" or "cancelled"`,
            allowedTransitions: ["received", "cancelled"],
          });
        }
      }
    }

    // Store old values for stock adjustment
    const oldItems = [...invoice.items];
    const oldPaidAmount = invoice.paidAmount;
    const oldStatus = invoice.status;
    const oldGrandTotal = invoice.grandTotal;

    // Update fields
    const updatableFields = [
      "items",
      "billingAddress",
      "shippingAddress",
      "additionalDiscount",
      "additionalCharges",
      "additionalChargesDetails",
      "autoRoundOff",
      "paidAmount",
      "fullyReceived",
      "paymentMethod",
      "notes",
      "termsAndConditions",
      "status",
      "dueDate",
      "invoiceDate",
    ];

    updatableFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        // Convert string booleans
        if (field === "autoRoundOff" || field === "fullyReceived") {
          invoice[field] =
            updateData[field] === true || updateData[field] === "true";
        }
        // Convert numbers
        else if (field === "paidAmount") {
          invoice[field] = parseFloat(updateData[field]) || 0;
        }
        // Parse additionalDiscount if it's a string
        else if (
          field === "additionalDiscount" &&
          typeof updateData[field] === "string"
        ) {
          try {
            invoice[field] = JSON.parse(updateData[field]);
          } catch {
            invoice[field] = { pct: 0, amt: 0 };
          }
        } else {
          invoice[field] = updateData[field];
        }
      }
    });

    // Handle stock adjustment if items changed
    if (updateData.items !== undefined) {
      // Restore old stock
      for (const item of oldItems) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stockQuantity: -item.qty },
          });
        }
      }

      // Add new stock
      for (const item of invoice.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stockQuantity: item.qty },
          });
        }
      }
    }

    // Recalculate totals
    invoice.calculateTotals();

    // Handle status update
    // Handle status update ONLY if status not explicitly sent
    if (
      updateData.status === undefined &&
      (updateData.paidAmount !== undefined ||
        updateData.fullyReceived !== undefined) &&
      !["received", "cancelled"].includes(invoice.status)
    ) {
      const newPaidAmount = invoice.paidAmount || 0;
      const newFullyReceived = invoice.fullyReceived || false;

      if (newFullyReceived || newPaidAmount >= invoice.grandTotal) {
        invoice.status = "received";
      } else if (newPaidAmount > 0) {
        invoice.status = "partial";
      } else {
        invoice.status = "converted";
      }
    }

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "supplier_invoice_attachments",
          });

          invoice.attachments.push({
            url: result.secure_url,
            public_id: result.public_id,
            filename: file.originalname,
            uploadedAt: new Date(),
          });
        } catch (uploadError) {
          // console.error("Cloudinary upload error:", uploadError);
        }
      }
    }

    // Save updated invoice
    invoice.updatedAt = new Date();
    await invoice.save();

    // Update supplier statistics
    if (
      oldGrandTotal !== invoice.grandTotal ||
      oldPaidAmount !== invoice.paidAmount
    ) {
      const amountDiff = invoice.grandTotal - oldGrandTotal;
      const paidDiff = invoice.paidAmount - oldPaidAmount;

      await Supplier.findByIdAndUpdate(invoice.supplierId, {
        $inc: {
          totalPurchaseAmount: amountDiff,
          totalPaidAmount: paidDiff,
          totalDueAmount:
            invoice.grandTotal -
            invoice.paidAmount -
            (oldGrandTotal - oldPaidAmount),
        },
      });
    }

    // Populate for response
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate("supplierId", "name phone email")
      .populate("items.productId", "productName hsn");

    res.json({
      success: true,
      message: "Invoice updated successfully",
      invoice: populatedInvoice,
      changes: {
        paidAmount: oldPaidAmount !== invoice.paidAmount,
        status: oldStatus !== invoice.status,
        itemsChanged: updateData.items !== undefined,
      },
    });
  } catch (err) {
    // console.error("Update supplier invoice error:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: Object.values(err.errors).map((e) => e.message),
      });
    }

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Invoice number conflict",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update invoice",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID format",
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    const supplierId = invoice.supplierId;
    const paidAmount = invoice.paidAmount || 0;
    const grandTotal = invoice.grandTotal || 0;
    const items = invoice.items || [];

    // Restore product stock (DECREASE stock when deleting supplier invoice)
    for (const item of items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stockQuantity: -item.qty },
        });
      }
    }

    // Update supplier statistics
    await Supplier.findByIdAndUpdate(supplierId, {
      $inc: {
        totalInvoices: -1,
        totalPurchaseAmount: -grandTotal,
        totalPaidAmount: -paidAmount,
        totalDueAmount: -(grandTotal - paidAmount),
      },
    });

    // Delete attachments from Cloudinary
    if (invoice.attachments && invoice.attachments.length > 0) {
      const deletePromises = invoice.attachments
        .filter((attachment) => attachment.public_id)
        .map((attachment) =>
          cloudinary.uploader.destroy(attachment.public_id).catch((err) => {
            // console.error(`Failed to delete Cloudinary file ${attachment.public_id}:`,err.message,);
          }),
        );

      await Promise.allSettled(deletePromises);
    }

    // Delete the invoice
    await Invoice.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Supplier invoice deleted successfully",
      deleted: {
        invoiceId: req.params.id,
        invoiceNo: invoice.invoiceNo,
        stockAdjusted: items.length,
        attachmentsDeleted: invoice.attachments?.length || 0,
      },
    });
  } catch (err) {
    // console.error("Delete supplier invoice error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete invoice",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Add payment to invoice
exports.addPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, referenceNumber, notes } = req.body;

    // Validate input
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid payment amount greater than 0 is required",
      });
    }

    const paymentAmount = parseFloat(amount);

    // Validate invoice ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID format",
      });
    }

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Check if invoice is already fully paid
    if (invoice.status === "received" && invoice.dueAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invoice is already fully paid",
        dueAmount: invoice.dueAmount,
        paidAmount: invoice.paidAmount,
      });
    }

    if (["received", "cancelled"].includes(invoice.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot add payment to ${invoice.status === "received" ? "approved" : "rejected"} invoice`,
        status: invoice.status,
      });
    }

    // Check if payment exceeds due amount
    const remainingDue = invoice.grandTotal - invoice.paidAmount;
    if (paymentAmount > remainingDue) {
      return res.status(400).json({
        success: false,
        error: `Payment amount exceeds due amount. Due: ₹${remainingDue.toFixed(
          2,
        )}`,
        dueAmount: remainingDue,
        maxPayment: remainingDue,
      });
    }

    // Store old values
    const oldPaidAmount = invoice.paidAmount;
    const oldStatus = invoice.status;
    const oldDueAmount = invoice.dueAmount;

    // Update invoice payment
    invoice.paidAmount += paymentAmount;
    invoice.paymentMethod = paymentMethod || invoice.paymentMethod;

    // Add payment note if provided
    if (notes) {
      invoice.notes = invoice.notes
        ? `${invoice.notes}\nPayment: ${notes}`
        : `Payment: ${notes}`;
    }

    // Recalculate totals and status
    invoice.calculateTotals();

    // Add payment record to payment history
    if (!invoice.paymentHistory) {
      invoice.paymentHistory = [];
    }

    invoice.paymentHistory.push({
      date: new Date(),
      amount: paymentAmount,
      method: paymentMethod || invoice.paymentMethod,
      reference: referenceNumber || "",
      notes: notes || "",
      addedBy: req.user?._id,
    });

    await invoice.save();

    // Update supplier statistics
    await Supplier.findByIdAndUpdate(invoice.supplierId, {
      $inc: {
        totalPaidAmount: paymentAmount,
        totalDueAmount: -paymentAmount,
      },
      $set: {
        lastPaymentDate: new Date(),
      },
    });

    // Populate for response
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate("supplierId", "name phone")
      .populate("createdBy", "firstName lastName");

    res.json({
      success: true,
      message: "Payment added successfully",
      invoice: populatedInvoice,
      payment: {
        amount: paymentAmount,
        previousPaid: oldPaidAmount,
        newPaid: invoice.paidAmount,
        previousDue: oldDueAmount,
        newDue: invoice.dueAmount,
        statusChanged: oldStatus !== invoice.status,
        newStatus: invoice.status,
      },
    });
  } catch (err) {
    // console.error("Add payment to supplier invoice error:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: Object.values(err.errors).map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to add payment",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Get invoice statistics
exports.getInvoiceStats = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      supplierId,
      status,
      period = "all",
    } = req.query;

    const matchStage = {};

    if (supplierId && mongoose.Types.ObjectId.isValid(supplierId)) {
      matchStage.supplierId = new mongoose.Types.ObjectId(supplierId);
    }

    if (status) {
      const allowedStatuses = [
        "draft",
        "received",
        "partial",
        "cancelled",
        "overdue",
      ];
      if (allowedStatuses.includes(status)) {
        matchStage.status = status;
      }
    }

    if (startDate || endDate || period !== "all") {
      matchStage.invoiceDate = {};

      if (startDate) {
        matchStage.invoiceDate.$gte = new Date(startDate);
      } else if (period !== "all") {
        const now = new Date();
        if (period === "today") {
          matchStage.invoiceDate.$gte = new Date(now.setHours(0, 0, 0, 0));
        } else if (period === "week") {
          matchStage.invoiceDate.$gte = new Date(
            now.setDate(now.getDate() - 7),
          );
        } else if (period === "month") {
          matchStage.invoiceDate.$gte = new Date(
            now.setMonth(now.getMonth() - 1),
          );
        } else if (period === "year") {
          matchStage.invoiceDate.$gte = new Date(
            now.setFullYear(now.getFullYear() - 1),
          );
        }
      }

      if (endDate) {
        matchStage.invoiceDate.$lte = new Date(endDate);
      }
    }

    const statsPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$dueAmount" },
          totalTax: { $sum: "$totalTax" },
          totalDiscount: { $sum: "$totalDiscount" },
          totalAdditionalCharges: { $sum: "$additionalCharges" },
          avgInvoiceValue: { $avg: "$grandTotal" },
          maxInvoiceValue: { $max: "$grandTotal" },
          minInvoiceValue: { $min: "$grandTotal" },
        },
      },
      {
        $project: {
          _id: 0,
          totalInvoices: 1,
          totalAmount: { $round: ["$totalAmount", 2] },
          totalPaid: { $round: ["$totalPaid", 2] },
          totalDue: { $round: ["$totalDue", 2] },
          totalTax: { $round: ["$totalTax", 2] },
          totalDiscount: { $round: ["$totalDiscount", 2] },
          totalAdditionalCharges: { $round: ["$totalAdditionalCharges", 2] },
          avgInvoiceValue: { $round: ["$avgInvoiceValue", 2] },
          maxInvoiceValue: { $round: ["$maxInvoiceValue", 2] },
          minInvoiceValue: { $round: ["$minInvoiceValue", 2] },
          paymentEfficiency: {
            $cond: {
              if: { $gt: ["$totalAmount", 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$totalPaid", "$totalAmount"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              else: 0,
            },
          },
        },
      },
    ];

    const stats = await Invoice.aggregate(statsPipeline);

    // Status-wise counts
    const statusCounts = await Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          status: "$_id",
          count: 1,
          totalAmount: { $round: ["$totalAmount", 2] },
          _id: 0,
        },
      },
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalInvoices: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalDue: 0,
        totalTax: 0,
        totalDiscount: 0,
        totalAdditionalCharges: 0,
        avgInvoiceValue: 0,
        maxInvoiceValue: 0,
        minInvoiceValue: 0,
        paymentEfficiency: 0,
      },
      statusCounts,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        supplierId: supplierId || null,
        status: status || null,
        period: period,
      },
    });
  } catch (err) {
    // console.error("Get supplier invoice stats error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
    });
  }
};

// Get invoices by supplier
exports.getInvoicesBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const {
      status,
      startDate,
      endDate,
      limit = 50,
      page = 1,
      search = "",
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid supplier ID format",
      });
    }

    const filter = { supplierId };

    if (status && status !== "all") {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.invoiceDate = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.invoiceDate.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.invoiceDate.$lte = end;
      }
    }

    const limitNum = parseInt(limit);
    const pageNum = Math.max(1, parseInt(page));
    const skip = (pageNum - 1) * limitNum;

    const term = String(search || "").trim();
    const queryFilter = { ...filter };
    if (term) {
      queryFilter.$or = [
        { invoiceNo: { $regex: term, $options: "i" } },
        { "items.itemName": { $regex: term, $options: "i" } },
      ];
    }

    const invoices = await Invoice.find(queryFilter)
      .select(
        "_id invoiceNo invoiceDate dueDate grandTotal paidAmount dueAmount status paymentMethod items",
      )
      .populate({
        path: "items.productId",
        select:
          "itemBarcode stockQuantity productName hsn purchasePrice category",
        populate: { path: "category", select: "categoryName" },
      })
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Invoice.countDocuments(queryFilter);

    const summary = {
      totalInvoices: total,
      totalAmount: invoices.reduce(
        (sum, inv) => sum + (inv.grandTotal || 0),
        0,
      ),
      totalPaid: invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0),
      totalDue: invoices.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0),
    };

    res.json({
      success: true,
      count: invoices.length,
      summary,
      invoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    // console.error("Get supplier invoices error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch supplier invoices",
    });
  }
};

// Get unpaid invoices by supplier
exports.getUnpaidInvoicesBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid supplier ID format",
      });
    }

    const unpaidInvoices = await Invoice.find({
      supplierId,
      dueAmount: { $gt: 0 },
      status: { $in: ["converted", "partial"] },
    })
      .select(
        "_id invoiceNo invoiceDate dueDate grandTotal paidAmount dueAmount status",
      )
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      count: unpaidInvoices.length,
      invoices: unpaidInvoices,
    });
  } catch (error) {
    // console.error("Get unpaid supplier invoices error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch unpaid invoices",
    });
  }
};

// Get overdue invoices by supplier
exports.getOverdueInvoicesBySupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const today = new Date();

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid supplier ID format",
      });
    }

    const overdueInvoices = await Invoice.find({
      supplierId,
      dueDate: { $lt: today },
      dueAmount: { $gt: 0 },
      status: { $in: ["converted", "partial"] },
    })
      .select(
        "_id invoiceNo invoiceDate dueDate grandTotal paidAmount dueAmount status",
      )
      .sort({ dueDate: 1 });

    const totalOverdue = overdueInvoices.reduce(
      (sum, inv) => sum + inv.dueAmount,
      0,
    );

    res.json({
      success: true,
      count: overdueInvoices.length,
      totalOverdue,
      invoices: overdueInvoices,
    });
  } catch (error) {
    // console.error("Get overdue supplier invoices error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch overdue invoices",
    });
  }
};

const Quotation = require("../models/CustomerQuotationModel");
const Invoice = require("../models/CustomerInvoiceModel");
const Customer = require("../models/customerModel");
const Product = require("../models/productModels");
const cloudinary = require("../utils/cloudinary/cloudinary");
const mongoose = require("mongoose");
const User = require("../models/usersModels");

// Helper: Generate unique quotation number
const generateQuotationNo = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  // Count quotations with same prefix (QUOT + YYYY + MM)
  const prefix = `QUOT${year}${month}`;
  const count = await Quotation.countDocuments({
    quotationNo: { $regex: `^${prefix}` },
  });

  // Generate 3-digit sequence
  const sequence = String(count + 1).padStart(3, "0");
  return `${prefix}${sequence}`;
};

// Helper: Parse FormData nested objects
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

// Create quotation
exports.createQuotation = async (req, res) => {
  try {
    // Parse FormData first
    const parsedBody = parseFormDataNested(req.body);

    console.log("Parsed FormData for Quotation:", JSON.stringify(parsedBody, null, 2));

    // Extract fields from parsed body
    let {
      customerId,
      quotationDate,
      expiryDate,
      validForDays = 30,
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
      shoppingPointsUsed = 0,
      pointValue = 10,
      autoRoundOff = false,
      grandTotal,
      notes = "",
      termsAndConditions = "",
      status = "draft",
    } = parsedBody;

    // Convert string booleans and numbers
    autoRoundOff = autoRoundOff === true || autoRoundOff === "true";
    validForDays = parseInt(validForDays) || 30;
    shoppingPointsUsed = parseFloat(shoppingPointsUsed) || 0;
    subtotal = parseFloat(subtotal) || 0;
    totalTax = parseFloat(totalTax) || 0;
    totalDiscount = parseFloat(totalDiscount) || 0;
    grandTotal = parseFloat(grandTotal) || 0;
    additionalCharges = parseFloat(additionalCharges) || 0;

    // Validate required fields
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: "Customer ID is required",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one item is required",
      });
    }

    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        error: "Customer not found" 
      });
    }

    // Validate shopping points
    if (shoppingPointsUsed > 0) {
      const availablePoints = customer.availablePoints || 0;
      if (shoppingPointsUsed > availablePoints) {
        return res.status(400).json({
          success: false,
          error: `Insufficient shopping points. Available: ${availablePoints}`,
        });
      }
    }

    // Validate products
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

      // Use item data from frontend (already calculated)
      const validatedItem = {
        productId: item.productId,
        itemName: item.itemName || product.productName,
        hsnCode: item.hsnCode || product.hsnCode || "",
        qty: parseFloat(item.qty) || 1,
        unit: item.unit || product.unit || "Piece",
        unitPrice: parseFloat(item.unitPrice) || product.sellingPrice || 0,
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

    // Calculate points redeemed amount
    const pointsRedeemedAmount = shoppingPointsUsed * pointValue;

    // Generate quotation number
    const quotationNo = await generateQuotationNo();

    // Handle file uploads if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "quotation_attachments",
            resource_type: "auto",
          });

          attachments.push({
            url: result.secure_url,
            public_id: result.public_id,
            filename: file.originalname,
          });
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
        }
      }
    }

    // Calculate expiry date if not provided
    let calculatedExpiryDate;
    if (expiryDate) {
      calculatedExpiryDate = new Date(expiryDate);
    } else {
      calculatedExpiryDate = new Date(quotationDate || new Date());
      calculatedExpiryDate.setDate(calculatedExpiryDate.getDate() + validForDays);
    }

    // Create quotation
    const quotation = new Quotation({
      customerId,
      quotationNo,
      quotationDate: quotationDate ? new Date(quotationDate) : new Date(),
      expiryDate: calculatedExpiryDate,
      validForDays,
      items: validatedItems,
      billingAddress: billingAddress || customer.address || "",
      shippingAddress:
        shippingAddress || billingAddress || customer.address || "",
      subtotal: subtotal,
      totalTax: totalTax,
      totalDiscount: totalDiscount,
      additionalDiscount: additionalDiscount,
      additionalCharges: additionalCharges,
      additionalChargesDetails: additionalChargesDetails,
      shoppingPointsUsed: shoppingPointsUsed,
      pointValue: pointValue,
      autoRoundOff: autoRoundOff,
      grandTotal: grandTotal,
      status: status,
      notes: notes,
      termsAndConditions: termsAndConditions,
      attachments: attachments,
      createdBy: req.user?._id,
    });

    // Calculate round off value if needed
    if (autoRoundOff) {
      const itemsDiscount = validatedItems.reduce(
        (sum, item) => sum + (item.discountAmt || 0),
        0
      );
      const additionalDiscountValue =
        additionalDiscount.amt +
        (subtotal * (additionalDiscount.pct || 0)) / 100;
      const totalDiscountCalc = itemsDiscount + additionalDiscountValue;

      const totalBeforeRound =
        subtotal +
        totalTax +
        additionalCharges -
        totalDiscountCalc -
        pointsRedeemedAmount;

      quotation.roundOffValue = Math.round(totalBeforeRound) - totalBeforeRound;
    }

    // Save quotation
    await quotation.save();

    // Update customer shopping points if used
    if (shoppingPointsUsed > 0) {
      await Customer.findByIdAndUpdate(
        customerId,
        {
          $inc: {
            availablePoints: -shoppingPointsUsed,
            usedPoints: shoppingPointsUsed,
          },
          $set: {
            lastPointsRedeemedDate: new Date(),
          },
        }
      );
    }

    // Populate and return response
    const populatedQuotation = await Quotation.findById(quotation._id)
      .populate("customerId", "name phone email availablePoints")
      .populate("items.productId", "productName hsnCode unit sellingPrice")
      .populate("createdBy", "firstName lastName");

    res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      quotation: populatedQuotation,
      points: {
        redeemed: shoppingPointsUsed,
      },
    });
  } catch (err) {
    console.error("Quotation creation error:", err);

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
        error: "Quotation number already exists",
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

// Get all quotations with filters
exports.getAllQuotations = async (req, res) => {
  try {
    const {
      customerId,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      expired = false,
    } = req.query;

    const filter = {};

    // Validate customerId
    if (customerId) {
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid customer ID format",
        });
      }
      filter.customerId = customerId;
    }

    // Validate status
    if (status) {
      const allowedStatuses = [
        "draft",
        "sent",
        "accepted",
        "rejected",
        "expired",
        "converted",
      ];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
        });
      }
      filter.status = status;
    }

    // Filter expired quotations
    if (expired === "true" || expired === true) {
      filter.expiryDate = { $lt: new Date() };
    } else if (expired === "false" || expired === false) {
      filter.expiryDate = { $gte: new Date() };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.quotationDate = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid start date format",
          });
        }
        filter.quotationDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid end date format",
          });
        }
        filter.quotationDate.$lte = end;
      }
    }

    // Parse pagination parameters safely
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = Quotation.find(filter)
      .populate("customerId", "name phone email")
      .populate("createdBy", "firstName lastName")
      .populate("convertedToInvoice", "invoiceNo status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Handle search
    if (search) {
      query = Quotation.find({
        ...filter,
        quotationNo: { $regex: search, $options: "i" },
      })
        .populate("customerId", "name phone email")
        .populate("createdBy", "firstName lastName")
        .populate("convertedToInvoice", "invoiceNo status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    }

    const quotations = await query;
    const total = await Quotation.countDocuments(filter);

    // Format response
    const response = {
      success: true,
      count: quotations.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
      quotations,
    };

    if (search && quotations.length === 0) {
      response.message = "No quotations found matching your search";
    }

    res.json(response);
  } catch (err) {
    console.error("Get quotations error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch quotations",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Get single quotation by ID
exports.getQuotationById = async (req, res) => {
  try {
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid quotation ID format",
      });
    }

    const quotation = await Quotation.findById(req.params.id)
      .populate(
        "customerId",
        "name phone email address city state country pincode gstin"
      )
      .populate("createdBy", "firstName lastName email")
      .populate("convertedToInvoice", "invoiceNo invoiceDate status grandTotal")
      .populate(
        "items.productId",
        "productName hsnCode sku barcode unit sellingPrice tax"
      );

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
        message: `No quotation found with ID: ${req.params.id}`,
      });
    }

    // Calculate any missing totals
    if (!quotation.subtotal || !quotation.totalTax || !quotation.grandTotal) {
      quotation.calculateTotals();
      await quotation.save();
    }

    res.json({
      success: true,
      quotation,
      formatted: {
        quotationDate: quotation.formattedDate,
        expiryDate: quotation.formattedExpiryDate,
        daysRemaining: quotation.daysRemaining,
      },
    });
  } catch (err) {
    console.error("Get quotation error:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid quotation ID",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch quotation",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Update quotation
exports.updateQuotation = async (req, res) => {
  try {
    // Validate quotation ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid quotation ID format",
      });
    }

    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ 
        success: false, 
        error: "Quotation not found" 
      });
    }

    // Parse FormData if exists
    let updateData = req.body;
    if (
      Object.keys(req.body).some(
        (key) => key.includes("[") && key.includes("]")
      )
    ) {
      updateData = parseFormDataNested(req.body);
    }

    // Store old values for adjustments
    const oldPointsUsed = quotation.shoppingPointsUsed;
    const oldStatus = quotation.status;

    // Update fields with validation
    const updatableFields = [
      "items",
      "billingAddress",
      "shippingAddress",
      "additionalDiscount",
      "additionalCharges",
      "additionalChargesDetails",
      "shoppingPointsUsed",
      "autoRoundOff",
      "validForDays",
      "expiryDate",
      "status",
      "notes",
      "termsAndConditions",
    ];

    updatableFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        // Convert string booleans
        if (field === "autoRoundOff") {
          quotation[field] =
            updateData[field] === true || updateData[field] === "true";
        }
        // Convert numbers
        else if (field === "shoppingPointsUsed" || field === "validForDays") {
          quotation[field] = parseFloat(updateData[field]) || 0;
        }
        // Parse additionalDiscount if it's a string
        else if (
          field === "additionalDiscount" &&
          typeof updateData[field] === "string"
        ) {
          try {
            quotation[field] = JSON.parse(updateData[field]);
          } catch {
            quotation[field] = { pct: 0, amt: 0 };
          }
        } else {
          quotation[field] = updateData[field];
        }
      }
    });

    // Handle shopping points adjustment
    if (updateData.shoppingPointsUsed !== undefined) {
      const newPointsUsed = parseFloat(updateData.shoppingPointsUsed) || 0;

      if (newPointsUsed !== oldPointsUsed) {
        const customer = await Customer.findById(quotation.customerId);
        if (customer) {
          // Calculate point difference
          const pointsDiff = newPointsUsed - oldPointsUsed;

          // Check if customer has enough points for increase
          if (pointsDiff > 0 && (customer.availablePoints || 0) < pointsDiff) {
            return res.status(400).json({
              success: false,
              error: `Customer doesn't have enough points. Available: ${
                customer.availablePoints || 0
              }`,
            });
          }

          // Update customer points
          customer.availablePoints = (customer.availablePoints || 0) - pointsDiff;
          customer.usedPoints = (customer.usedPoints || 0) + pointsDiff;
          await customer.save();
        }
      }
    }

    // Recalculate totals
    quotation.calculateTotals();

    // Handle file uploads if new files added
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "quotation_attachments",
          });

          quotation.attachments.push({
            url: result.secure_url,
            public_id: result.public_id,
            filename: file.originalname,
            uploadedAt: new Date(),
          });
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
        }
      }
    }

    // Update expiry date based on validForDays if changed
    if (updateData.validForDays !== undefined && !updateData.expiryDate) {
      quotation.expiryDate = new Date(quotation.quotationDate);
      quotation.expiryDate.setDate(quotation.expiryDate.getDate() + quotation.validForDays);
    }

    // Save updated quotation
    quotation.updatedAt = new Date();
    await quotation.save();

    // Populate for response
    const populatedQuotation = await Quotation.findById(quotation._id)
      .populate("customerId", "name phone email")
      .populate("createdBy", "firstName lastName")
      .populate("items.productId", "productName hsnCode");

    res.json({
      success: true,
      message: "Quotation updated successfully",
      quotation: populatedQuotation,
      changes: {
        pointsUsed: oldPointsUsed !== quotation.shoppingPointsUsed,
        status: oldStatus !== quotation.status,
      },
    });
  } catch (err) {
    console.error("Update quotation error:", err);

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
        error: "Quotation number conflict",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update quotation",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Delete quotation
exports.deleteQuotation = async (req, res) => {
  try {
    // Validate quotation ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid quotation ID format",
      });
    }

    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ 
        success: false, 
        error: "Quotation not found" 
      });
    }

    // Cannot delete converted quotation
    if (quotation.status === "converted" && quotation.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete quotation that has been converted to invoice",
        invoiceId: quotation.convertedToInvoice,
      });
    }

    // Store quotation data for cleanup
    const customerId = quotation.customerId;
    const shoppingPointsUsed = quotation.shoppingPointsUsed || 0;

    // Return shopping points to customer
    if (shoppingPointsUsed > 0) {
      const customer = await Customer.findById(customerId);
      if (customer) {
        customer.availablePoints = (customer.availablePoints || 0) + shoppingPointsUsed;
        customer.usedPoints = Math.max(0, (customer.usedPoints || 0) - shoppingPointsUsed);
        await customer.save();
      }
    }

    // Delete attachments from Cloudinary
    if (quotation.attachments && quotation.attachments.length > 0) {
      const deletePromises = quotation.attachments
        .filter((attachment) => attachment.public_id)
        .map((attachment) =>
          cloudinary.uploader.destroy(attachment.public_id).catch((err) => {
            console.error(
              `Failed to delete Cloudinary file ${attachment.public_id}:`,
              err.message
            );
          })
        );

      await Promise.allSettled(deletePromises);
    }

    // Delete the quotation
    await Quotation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Quotation deleted successfully",
      deleted: {
        quotationId: req.params.id,
        quotationNo: quotation.quotationNo,
        pointsReturned: shoppingPointsUsed,
        attachmentsDeleted: quotation.attachments?.length || 0,
      },
    });
  } catch (err) {
    console.error("Delete quotation error:", err);

    res.status(500).json({
      success: false,
      error: "Failed to delete quotation",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Convert quotation to invoice
exports.convertToInvoice = async (req, res) => {
  try {
    // Validate quotation ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid quotation ID format",
      });
    }

    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ 
        success: false, 
        error: "Quotation not found" 
      });
    }

    // Check if already converted
    if (quotation.status === "converted") {
      return res.status(400).json({
        success: false,
        error: "Quotation already converted to invoice",
        invoiceId: quotation.convertedToInvoice,
      });
    }

    // Check if expired
    if (quotation.expiryDate < new Date() && quotation.status !== "expired") {
      quotation.status = "expired";
      await quotation.save();
      
      return res.status(400).json({
        success: false,
        error: "Cannot convert expired quotation",
        expiryDate: quotation.expiryDate,
      });
    }

    // Generate new invoice number
    const generateInvoiceNo = async () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const prefix = `INV${year}${month}`;
      const count = await Invoice.countDocuments({
        invoiceNo: { $regex: `^${prefix}` },
      });
      const sequence = String(count + 1).padStart(3, "0");
      return `${prefix}${sequence}`;
    };

    const invoiceNo = await generateInvoiceNo();

    // Convert quotation to invoice
    const invoice = await quotation.convertToInvoice(invoiceNo);

    // Populate both for response
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate("customerId", "name phone email")
      .populate("createdBy", "firstName lastName")
      .populate("items.productId", "productName hsnCode");

    const populatedQuotation = await Quotation.findById(quotation._id)
      .populate("customerId", "name phone email")
      .populate("convertedToInvoice", "invoiceNo status");

    res.json({
      success: true,
      message: "Quotation successfully converted to invoice",
      quotation: populatedQuotation,
      invoice: populatedInvoice,
    });
  } catch (err) {
    console.error("Convert to invoice error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Invoice number already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to convert quotation to invoice",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Update quotation status (accept/reject)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status
    const allowedStatuses = ["accepted", "rejected", "sent", "draft"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    // Validate quotation ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid quotation ID format",
      });
    }

    const quotation = await Quotation.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({ 
        success: false, 
        error: "Quotation not found" 
      });
    }

    // Check if already converted
    if (quotation.status === "converted") {
      return res.status(400).json({
        success: false,
        error: "Cannot change status of converted quotation",
        invoiceId: quotation.convertedToInvoice,
      });
    }

    // Check if expired
    if (quotation.expiryDate < new Date() && status === "accepted") {
      return res.status(400).json({
        success: false,
        error: "Cannot accept expired quotation",
        expiryDate: quotation.expiryDate,
      });
    }

    const oldStatus = quotation.status;
    quotation.status = status;
    quotation.updatedAt = new Date();

    await quotation.save();

    const populatedQuotation = await Quotation.findById(quotation._id)
      .populate("customerId", "name phone email")
      .populate("createdBy", "firstName lastName");

    res.json({
      success: true,
      message: `Quotation status updated to ${status}`,
      quotation: populatedQuotation,
      changes: {
        from: oldStatus,
        to: status,
      },
    });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update quotation status",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Get quotation statistics
exports.getQuotationStats = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      customerId,
      status,
      period = "all",
    } = req.query;

    // Build match stage
    const matchStage = {};

    // Filter by customer
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      matchStage.customerId = new mongoose.Types.ObjectId(customerId);
    }

    // Filter by status
    if (status) {
      const allowedStatuses = [
        "draft",
        "sent",
        "accepted",
        "rejected",
        "expired",
        "converted",
      ];
      if (allowedStatuses.includes(status)) {
        matchStage.status = status;
      }
    }

    // Handle date range
    if (startDate || endDate || period !== "all") {
      matchStage.quotationDate = {};

      // Validate and set start date
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid start date format",
          });
        }
        matchStage.quotationDate.$gte = start;
      } else if (period !== "all") {
        const now = new Date();
        if (period === "today") {
          matchStage.quotationDate.$gte = new Date(now.setHours(0, 0, 0, 0));
        } else if (period === "week") {
          matchStage.quotationDate.$gte = new Date(now.setDate(now.getDate() - 7));
        } else if (period === "month") {
          matchStage.quotationDate.$gte = new Date(now.setMonth(now.getMonth() - 1));
        } else if (period === "year") {
          matchStage.quotationDate.$gte = new Date(now.setFullYear(now.getFullYear() - 1));
        }
      }

      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid end date format",
          });
        }
        matchStage.quotationDate.$lte = end;
      }
    }

    // Main stats aggregation
    const statsPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalQuotations: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
          totalTax: { $sum: "$totalTax" },
          totalDiscount: { $sum: "$totalDiscount" },
          totalAdditionalCharges: { $sum: "$additionalCharges" },
          totalPointsUsed: { $sum: "$shoppingPointsUsed" },
          totalPointsValue: {
            $sum: { $multiply: ["$shoppingPointsUsed", "$pointValue"] },
          },
          avgQuotationValue: { $avg: "$grandTotal" },
          maxQuotationValue: { $max: "$grandTotal" },
          minQuotationValue: { $min: "$grandTotal" },
          totalConverted: {
            $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] },
          },
          totalAccepted: {
            $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
          },
          totalRejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
          totalExpired: {
            $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalQuotations: 1,
          totalAmount: { $round: ["$totalAmount", 2] },
          totalTax: { $round: ["$totalTax", 2] },
          totalDiscount: { $round: ["$totalDiscount", 2] },
          totalAdditionalCharges: { $round: ["$totalAdditionalCharges", 2] },
          totalPointsUsed: 1,
          totalPointsValue: { $round: ["$totalPointsValue", 2] },
          avgQuotationValue: { $round: ["$avgQuotationValue", 2] },
          maxQuotationValue: { $round: ["$maxQuotationValue", 2] },
          minQuotationValue: { $round: ["$minQuotationValue", 2] },
          totalConverted: 1,
          totalAccepted: 1,
          totalRejected: 1,
          totalExpired: 1,
          conversionRate: {
            $cond: {
              if: { $gt: ["$totalQuotations", 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$totalConverted", "$totalQuotations"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              else: 0,
            },
          },
          acceptanceRate: {
            $cond: {
              if: { $gt: ["$totalQuotations", 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$totalAccepted", "$totalQuotations"] },
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

    const stats = await Quotation.aggregate(statsPipeline);

    // Status-wise counts
    const statusCounts = await Quotation.aggregate([
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

    // Monthly breakdown
    const monthlyBreakdown = await Quotation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$quotationDate" },
            month: { $month: "$quotationDate" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
          converted: {
            $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
      {
        $project: {
          _id: 0,
          period: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $toString: {
                  $cond: {
                    if: { $lt: ["$_id.month", 10] },
                    then: { $concat: ["0", { $toString: "$_id.month" }] },
                    else: { $toString: "$_id.month" },
                  },
                },
              },
            ],
          },
          count: 1,
          totalAmount: { $round: ["$totalAmount", 2] },
          converted: 1,
          conversionRate: {
            $cond: {
              if: { $gt: ["$count", 0] },
              then: { $round: [{ $multiply: [{ $divide: ["$converted", "$count"] }, 100] }, 2] },
              else: 0,
            },
          },
        },
      },
    ]);

    // Top customers by quotation count
    const topCustomers = await Quotation.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $group: {
          _id: "$customerId",
          customerName: { $first: "$customer.name" },
          quotationCount: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
          convertedCount: {
            $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] },
          },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          customerId: "$_id",
          customerName: 1,
          quotationCount: 1,
          totalAmount: { $round: ["$totalAmount", 2] },
          convertedCount: 1,
          conversionRate: {
            $cond: {
              if: { $gt: ["$quotationCount", 0] },
              then: { $round: [{ $multiply: [{ $divide: ["$convertedCount", "$quotationCount"] }, 100] }, 2] },
              else: 0,
            },
          },
        },
      },
    ]);

    // Expiring soon (within 7 days)
    const expiringSoon = await Quotation.find({
      status: { $in: ["draft", "sent"] },
      expiryDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
      .populate("customerId", "name phone email")
      .sort({ expiryDate: 1 })
      .limit(10);

    res.json({
      success: true,
      stats: stats[0] || {
        totalQuotations: 0,
        totalAmount: 0,
        totalTax: 0,
        totalDiscount: 0,
        totalAdditionalCharges: 0,
        totalPointsUsed: 0,
        totalPointsValue: 0,
        avgQuotationValue: 0,
        maxQuotationValue: 0,
        minQuotationValue: 0,
        totalConverted: 0,
        totalAccepted: 0,
        totalRejected: 0,
        totalExpired: 0,
        conversionRate: 0,
        acceptanceRate: 0,
      },
      statusCounts,
      monthlyBreakdown,
      topCustomers,
      expiringSoon,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        customerId: customerId || null,
        status: status || null,
        period: period,
      },
    });
  } catch (err) {
    console.error("Get quotation stats error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch quotation statistics",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
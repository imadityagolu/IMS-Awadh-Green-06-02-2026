const Invoice = require("../models/CustomerInvoiceModel");
const Customer = require("../models/customerModel");
const Product = require("../models/productModels");
const cloudinary = require("../utils/cloudinary/cloudinary");
const mongoose = require("mongoose");
const {
  updateCustomerDueAmount,
} = require("../controllers/customerController");
const CompanyBank = require("../models/settings/companyBankModel");

// Helper: Generate unique invoice number - MATCHING FRONTEND FORMAT
const generateInvoiceNo = async () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  // Count invoices with same prefix (INV + YYYY + MM)
  const prefix = `INV${year}${month}`;
  const count = await Invoice.countDocuments({
    invoiceNo: { $regex: `^${prefix}` },
  });

  // Generate 3-digit sequence
  const sequence = String(count + 1).padStart(3, "0");
  return `${prefix}${sequence}`;
};

// Helper: Parse FormData nested objects
const parseFormDataNested = (body) => {
  const parsed = { ...body };

  // Check if autoRoundOff is an array (this happens from FormData)
  if (Array.isArray(body.autoRoundOff)) {
    // Extract the actual value (should be the last element if both checkbox and value are sent)
    if (body.autoRoundOff.length === 2) {
      // If first element is "false" and second is a number, use the number
      if (
        body.autoRoundOff[0] === "false" &&
        !isNaN(parseInt(body.autoRoundOff[1]))
      ) {
        parsed.autoRoundOff = body.autoRoundOff[1]; // Use the numeric value
      } else {
        // Otherwise try to find a valid value
        const validValue = body.autoRoundOff.find((val) =>
          ["0", "1", "5", "10"].includes(val),
        );
        parsed.autoRoundOff = validValue || "0";
      }
    } else if (body.autoRoundOff.length === 1) {
      parsed.autoRoundOff = body.autoRoundOff[0];
    }
  }
  // parse dueDate if provided
  Object.keys(body).forEach((key) => {
    if (key.includes("dueDate")) {
      // console.log(`  ${key}: ${body[key]}`);
    }
  });

  // Check for dueDate in various possible formats
  if (body.dueDate !== undefined) {
    parsed.dueDate = body.dueDate;
    // console.log("Found dueDate in body.dueDate:", body.dueDate);
  } else if (body["dueDate[0]"] !== undefined) {
    // Handle array format dueDate[0], dueDate[1], etc.
    const dueDateArray = [];
    let i = 0;
    while (body[`dueDate[${i}]`] !== undefined) {
      dueDateArray.push(body[`dueDate[${i}]`]);
      i++;
    }
    parsed.dueDate = dueDateArray;
    // console.log("Found dueDate as array:", dueDateArray);
  }

  // ========== FIX: Parse tax settings properly ==========
  // Handle taxSettings if sent as separate fields
  if (body["taxSettings[autoRoundOff]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.autoRoundOff = body["taxSettings[autoRoundOff]"];
  }
  if (body["taxSettings[enableGSTBilling]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.enableGSTBilling =
      body["taxSettings[enableGSTBilling]"] !== "false";
  }
  if (body["taxSettings[priceIncludeGST]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.priceIncludeGST =
      body["taxSettings[priceIncludeGST]"] !== "false";
  }
  if (body["taxSettings[defaultGSTRate]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.defaultGSTRate = body["taxSettings[defaultGSTRate]"];
  }

  if (
    body["additionalDiscount[pct]"] !== undefined ||
    body["additionalDiscount[amt]"] !== undefined
  ) {
    // Parse additionalDiscount
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
      } else if (field === "selectedSerialNos") {
        try {
          // FIX: Properly parse JSON string
          const serialNosValue = body[key];

          // If it's already an array (string representation)
          if (typeof serialNosValue === "string") {
            // Check if it's JSON array format
            if (
              serialNosValue.startsWith("[") &&
              serialNosValue.endsWith("]")
            ) {
              items[index][field] = JSON.parse(serialNosValue);
            } else {
              // Handle comma-separated string
              items[index][field] = serialNosValue
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s);
            }
          } else if (Array.isArray(serialNosValue)) {
            // Already an array
            items[index][field] = serialNosValue;
          } else {
            items[index][field] = [];
          }
        } catch {
          items[index][field] = [];
        }
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

// Create invoice with file uploads - NO TRANSACTION VERSION
exports.createInvoice = async (req, res) => {
  try {
    // Parse FormData first
    const parsedBody = parseFormDataNested(req.body);
    // Add tax settings to parsed body
    if (!parsedBody.taxSettings) {
      parsedBody.taxSettings = {
        enableGSTBilling: parsedBody.enableGSTBilling !== "false",
        priceIncludeGST: parsedBody.priceIncludeGST !== "false",
        autoRoundOff: parsedBody.autoRoundOff || "0",
        defaultGSTRate: parsedBody.defaultGSTRate || "18",
      };
    } else {
      if (Array.isArray(parsedBody.taxSettings.autoRoundOff)) {
        parsedBody.taxSettings.autoRoundOff =
          parsedBody.taxSettings.autoRoundOff[0] || "0";
      }
      // Ensure all fields have proper values
      parsedBody.taxSettings = {
        enableGSTBilling: parsedBody.taxSettings.enableGSTBilling !== false,
        priceIncludeGST: parsedBody.taxSettings.priceIncludeGST !== false,
        autoRoundOff: parsedBody.taxSettings.autoRoundOff || "0",
        defaultGSTRate: parsedBody.taxSettings.defaultGSTRate || "18",
      };
    }

    // Debug log to see what's being received
    // console.log("Parsed FormData:", JSON.stringify(parsedBody, null, 2));

    // Extract fields from parsed body
    let {
      customerId,
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
      shoppingPointsUsed = 0,
      pointValue = 10,
      autoRoundOff = false,
      grandTotal,
      paidAmount = 0,
      fullyReceived = false,
      paymentMethod = "cash",
      notes = "",
      termsAndConditions = "",
    } = parsedBody;

    // Convert string booleans and numbers
    autoRoundOff = autoRoundOff === true || autoRoundOff === "true";
    fullyReceived = fullyReceived === true || fullyReceived === "true";
    paidAmount = parseFloat(paidAmount) || 0;
    shoppingPointsUsed = parseFloat(shoppingPointsUsed) || 0;
    subtotal = parseFloat(subtotal) || 0;
    totalTax = parseFloat(totalTax) || 0;
    totalDiscount = parseFloat(totalDiscount) || 0;
    grandTotal = parseFloat(grandTotal) || 0;
    additionalCharges = parseFloat(additionalCharges) || 0;

    // ========== FIX: Handle dueDate properly ==========
    let finalDueDate;

    // Log what we're receiving
    // console.log("Raw dueDate received:", dueDate);
    // console.log("Type of dueDate:", typeof dueDate);

    // If dueDate is an array (this is the issue!)
    if (Array.isArray(dueDate)) {
      // console.log("dueDate is an array, processing...");

      // Get the first valid date from the array
      for (const dateStr of dueDate) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          finalDueDate = date;
          // console.log("Selected valid date from array:", finalDueDate);
          break;
        }
      }

      // If no valid date in array, use default
      if (!finalDueDate) {
        // console.log("No valid date in array, using default");
        const defaultDueDate = new Date(invoiceDate || new Date());
        defaultDueDate.setDate(defaultDueDate.getDate() + 7);
        finalDueDate = defaultDueDate;
      }
    }
    // If dueDate is a string (normal case)
    else if (dueDate && typeof dueDate === "string") {
      finalDueDate = new Date(dueDate);
      // console.log("dueDate is string, parsing:", finalDueDate);

      // Validate date
      if (isNaN(finalDueDate.getTime())) {
        // console.log("Invalid date string, using default");
        const defaultDueDate = new Date(invoiceDate || new Date());
        defaultDueDate.setDate(defaultDueDate.getDate() + 7);
        finalDueDate = defaultDueDate;
      }
    }
    // If no dueDate provided, use default
    else {
      // console.log("No dueDate provided, using default");
      const defaultDueDate = new Date(invoiceDate || new Date());
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      finalDueDate = defaultDueDate;
    }

    // console.log("Final dueDate to be saved:", finalDueDate);
    // ========== END FIX ==========

    // Validate invoice date
    const invoiceDateObj = invoiceDate ? new Date(invoiceDate) : new Date();

    // Validate that due date is not before invoice date
    if (finalDueDate < invoiceDateObj) {
      return res.status(400).json({
        success: false,
        error: "Due Date cannot be before invoice date",
      });
    }
    if (!customerId) {
      // Validate required fields
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
    const customer = await Customer.findById(customerId); // NO SESSION
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
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

      const product = await Product.findById(item.productId); // NO SESSION
      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Product not found: ${item.productId}`,
        });
      }

      // Validate serial numbers if provided
      let selectedSerialNos = item.selectedSerialNos;

      // Convert to array if it's not already
      if (!Array.isArray(selectedSerialNos)) {
        if (typeof selectedSerialNos === "string") {
          // Try to parse JSON or split by comma
          try {
            if (
              selectedSerialNos.startsWith("[") &&
              selectedSerialNos.endsWith("]")
            ) {
              selectedSerialNos = JSON.parse(selectedSerialNos);
            } else {
              selectedSerialNos = selectedSerialNos
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s !== "");
            }
          } catch {
            selectedSerialNos = [];
          }
        } else if (selectedSerialNos) {
          // If it's a single value, wrap in array
          selectedSerialNos = [selectedSerialNos];
        } else {
          selectedSerialNos = [];
        }
      }

      if (selectedSerialNos.length > 0) {
        const availableSerials = product.serialNumbers || [];

        // Ensure all serials are strings for comparison
        const selectedSerialsStr = selectedSerialNos.map((s) =>
          String(s).trim(),
        );
        const availableSerialsStr = availableSerials.map((s) =>
          String(s).trim(),
        );

        const unavailableSerials = selectedSerialsStr.filter(
          (serial) => !availableSerialsStr.includes(serial),
        );

        if (unavailableSerials.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Serial number(s) not available for ${product.productName}: ${unavailableSerials.join(", ")}`,
          });
        }
      }

      // Check stock availability
      const currentStock = product.stockQuantity || 0;
      const requestedQty = parseFloat(item.qty) || 1;

      if (currentStock < requestedQty) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.productName}. Available: ${currentStock}, Requested: ${requestedQty}`,
        });
      }

      // Use item data from frontend (already calculated)
      const validatedItem = {
        productId: item.productId,
        itemName: item.itemName || product.productName,
        hsnCode: item.hsnCode || product.hsnCode || "",
        // serialno: item.serialno || selectedSerialNos.join(", "),
        selectedSerialNos: selectedSerialNos,
        description:item.description || product.description || "",
        lotNumber: item.lotNumber || product.lotNumber || "", // Add lot number
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

    // Generate invoice number (matching frontend format)
    const invoiceNo = await generateInvoiceNo();

    // Handle file uploads if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "invoice_attachments",
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

    // Calculate payment amounts (frontend logic)
    const finalPaidAmount = fullyReceived ? grandTotal : paidAmount;
    const dueAmount = Math.max(0, grandTotal - finalPaidAmount);
    const advanceAmount = Math.max(0, finalPaidAmount - grandTotal);

    // Determine status (frontend logic)
    let finalStatus = "draft";
    if (fullyReceived || finalPaidAmount >= grandTotal) {
      finalStatus = "paid";
    } else if (finalPaidAmount > 0) {
      finalStatus = "partial";
    }

    // Fetch default company bank (snapshot)
    const defaultBank = await CompanyBank.findOne({ isDefault: true });

    if (!defaultBank) {
      return res.status(400).json({
        success: false,
        error:
          "No default company bank account found. Please set a default bank.",
      });
    }

    // Add stock validation before creating invoice
    // for (const item of validatedItems) {
    //   if (item.productId) {
    //     const product = await Product.findById(item.productId);
    //     if (product) {
    //       // After use stock quantity
    //       const currentStock = product.stockQuantity || 0;
    //       if (currentStock < item.qty) {
    //         return res.status(400).json({
    //           success: false,
    //           error: `Insufficient stock for ${product.productName}. Available: ${currentStock}, Requested: ${item.qty}`,
    //         });
    //       }
    //       // check if serial numbers are provided and validate them
    //       if (item.selectedSerialNos && item.selectedSerialNos.length > 0) {
    //         const availableSerials = product.serialNumbers || [];
    //         const selectedSerialsStr = item.selectedSerialNos.map((s) =>
    //           String(s).trim(),
    //         );
    //         const availableSerialsStr = availableSerials.map((s) =>
    //           String(s).trim(),
    //         );
    //         // Check if all selected serials are available
    //         const unavailableSerials = item.selectedSerialNos.filter(
    //           (serial) => !availableSerials.includes(serial),
    //         );

    //         if (unavailableSerials.length > 0) {
    //           return res.status(400).json({
    //             success: false,
    //             error: `Serial number(s) not available for ${product.productName}: ${unavailableSerials.join(", ")}`,
    //           });
    //         }
    //         // remove used serial numbers from product's avaialble list
    //         const remainingSerials = availableSerials.filter(
    //           (serial) => !item.serialNumbers.includes(serial),
    //         );
    //         // update product with remaining serial numbers
    //         // product.serialno = remainingSerials.join(", ");
    //       }
    //       //update stock
    //       product.stockQuantity = currentStock - item.qty;
    //       await product.save();
    //     }
    //   }
    // }
    // Create invoice - USING VALUES FROM FRONTEND
    const invoice = new Invoice({
      customerId,
      invoiceNo,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      dueDate: finalDueDate,
      bankDetails: {
        bankName: defaultBank.bankName,
        accountHolderName: defaultBank.accountHolderName,
        accountNumber: defaultBank.accountNumber,
        ifsc: defaultBank.ifsc,
        branch: defaultBank.branch,
        upiId: defaultBank.upiId,
        qrCode: defaultBank.qrCode,
      },

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
      paidAmount: finalPaidAmount,
      dueAmount: dueAmount,
      advanceAmount: advanceAmount,
      fullyReceived: fullyReceived,
      paymentMethod: paymentMethod,
      status: finalStatus,
      notes: notes,
      termsAndConditions: termsAndConditions,
      taxSettings: parsedBody.taxSettings,
      attachments: attachments,
      createdBy: req.user?._id,
    });

    // Calculate round off value if needed
    if (autoRoundOff) {
      // Recalculate to get round off value
      const itemsDiscount = validatedItems.reduce(
        (sum, item) => sum + (item.discountAmt || 0),
        0,
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

      invoice.roundOffValue = Math.round(totalBeforeRound) - totalBeforeRound;
    }

    // Save invoice - NO SESSION
    await invoice.save();

    // UPDATE PRODUCTS AFTER SUCCESSFUL INVOICE CREATION
    for (const item of validatedItems) {
      if (item.productId) {
        const product = await Product.findById(item.productId);
        if (product) {
          // Update stock quantity
          product.stockQuantity = Math.max(
            0,
            (product.stockQuantity || 0) - item.qty,
          );

          // Remove serial numbers if any
          if (item.selectedSerialNos && item.selectedSerialNos.length > 0) {
            const currentSerials = product.serialNumbers || [];
            const remainingSerials = currentSerials.filter(
              (serial) => !item.selectedSerialNos.includes(serial),
            );
            product.serialNumbers = remainingSerials;
          }

          await product.save();
        }
      }
    }

    // Calculate points earned (1 point per ₹10 spent)
    const POINTS_RATE = 10;
    const pointsEarned =
      finalPaidAmount > 0 ? Math.floor(finalPaidAmount / POINTS_RATE) : 0;

    // Update customer points and purchase history - NO SESSION
    await Customer.findByIdAndUpdate(customerId, {
      $inc: {
        availablePoints: pointsEarned - shoppingPointsUsed,
        totalPointsEarned: pointsEarned,
        totalPointsRedeemed: shoppingPointsUsed,
        totalPurchases: 1,
        totalPurchaseAmount: grandTotal,
      },
      $set: {
        lastPurchaseDate: new Date(),
        lastPointsEarnedDate:
          pointsEarned > 0 ? new Date() : customer.lastPointsEarnedDate,
        lastPointsRedeemedDate:
          shoppingPointsUsed > 0 ? new Date() : customer.lastPointsRedeemedDate,
      },
    });

    // Update customer due amount
    await updateCustomerDueAmount(customerId);

    // Update product stock quantities
    // for (const item of validatedItems) {
    //   if (item.productId) {
    //     await Product.findByIdAndUpdate(
    //       item.productId,
    //       {
    //         $inc: { stockQuantity: -item.qty },
    //       },
    //       { new: true },
    //     );
    //   }
    // }

    // Populate and return response
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate("customerId", "name phone availablePoints")
      .populate("items.productId", "productName hsnCode");

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice: populatedInvoice,
      points: {
        earned: pointsEarned,
        redeemed: shoppingPointsUsed,
        net: pointsEarned - shoppingPointsUsed,
      },
    });
  } catch (err) {
    console.error("Invoice creation error:", err);

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

// Get all invoices with filters
exports.getAllInvoices = async (req, res) => {
  try {
    const {
      customerId,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
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

    // Validate status (only if provided)
    if (status) {
      const allowedStatuses = [
        "draft",
        "sent",
        "paid",
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

    // Date range filter
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid start date format",
          });
        }
        filter.invoiceDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid end date format",
          });
        }
        filter.invoiceDate.$lte = end;
      }
    }

    // Parse pagination parameters safely
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = Invoice.find(filter)
      .populate("customerId", "name phone email")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Handle search
    if (search) {
      query = Invoice.find({
        ...filter,
        invoiceNo: { $regex: search, $options: "i" },
      })
        .populate("customerId", "name phone email")
        .populate("createdBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    }

    const invoices = await query;
    const total = await Invoice.countDocuments(filter);

    // Format response
    const response = {
      success: true,
      count: invoices.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
      invoices,
    };

    // If no invoices found but search was used
    if (search && invoices.length === 0) {
      response.message = "No invoices found matching your search";
    }

    res.json(response);
  } catch (err) {
    console.error("Get invoices error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch invoices",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Get single invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    const identifier = req.params.id;
    let invoice;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      invoice = await Invoice.findById(identifier)
        .populate(
          "customerId",
          "name phone email address city state country pincode gstin",
        )
        .populate("createdBy", "firstName lastName email")
        .populate(
          "items.productId",
          "productName hsnCode hsn barcode unit sellingPrice tax",
        );
    } else {
      invoice = await Invoice.findOne({ invoiceNo: identifier })
        .populate(
          "customerId",
          "name phone email address city state country pincode gstin",
        )
        .populate("createdBy", "firstName lastName email")
        .populate(
          "items.productId",
          "productName hsnCode hsn barcode unit sellingPrice tax",
        );
    }

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
        message: `No invoice found with identifier: ${identifier}`,
      });
    }

    // Calculate any missing totals (backward compatibility)
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
        dueStatus: invoice.dueStatus,
        daysRemaining: invoice.daysRemaining,
      },
    });
  } catch (err) {
    console.error("Get invoice error:", err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch invoice",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Update invoice - NO TRANSACTION VERSION
exports.updateInvoice = async (req, res) => {
  try {
    // Validate invoice ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID format",
      });
    }

    const invoice = await Invoice.findById(req.params.id); // NO SESSION
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

    // Store old values for adjustments
    const oldPointsUsed = invoice.shoppingPointsUsed;
    const oldPaidAmount = invoice.paidAmount;
    const oldStatus = invoice.status;
    const oldGrandTotal = invoice.grandTotal;

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
      "paidAmount",
      "fullyReceived",
      "paymentMethod",
      "notes",
      "termsAndConditions",
      "status",
      "dueDate",
    ];

    updatableFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        if (field === "dueDate") {
          const newDueDate = new Date(updateData[field]);
          // validate due date is not before invoice date
          if (newDueDate < invoice.invoiceDate) {
            return res.status(400).json({
              success: false,
              error: "Due date cannot be before invoice date",
            });
          }
          invoice[field] = newDueDate;
        }
        // Convert string booleans
        else if (field === "autoRoundOff" || field === "fullyReceived") {
          invoice[field] =
            updateData[field] === true || updateData[field] === "true";
        }
        // Convert numbers
        else if (["shoppingPointsUsed", "paidAmount"].includes(field)) {
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

    // Handle shopping points adjustment
    if (updateData.shoppingPointsUsed !== undefined) {
      const newPointsUsed = parseFloat(updateData.shoppingPointsUsed) || 0;

      if (newPointsUsed !== oldPointsUsed) {
        const customer = await Customer.findById(invoice.customerId); // NO SESSION
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
          customer.availablePoints =
            (customer.availablePoints || 0) - pointsDiff;
          customer.usedPoints = (customer.usedPoints || 0) + pointsDiff;
          await customer.save(); // NO SESSION
        }
      }
    }

    // Recalculate totals
    invoice.calculateTotals();

    // Handle status update based on payment changes
    if (
      updateData.paidAmount !== undefined ||
      updateData.fullyReceived !== undefined
    ) {
      const newPaidAmount = invoice.paidAmount || 0;
      const newFullyReceived = invoice.fullyReceived || false;

      if (newFullyReceived || newPaidAmount >= invoice.grandTotal) {
        invoice.status = "paid";
      } else if (newPaidAmount > 0) {
        invoice.status = "partial";
      } else {
        invoice.status = "draft";
      }
    }

    // Handle file uploads if new files added
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "invoice_attachments",
          });

          invoice.attachments.push({
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

    // Save updated invoice
    invoice.updatedAt = new Date();
    await invoice.save(); // NO SESSION
    await updateCustomerDueAmount(invoice.customerId);

    // Update customer points earned if status changed to paid/partial
    if (
      invoice.status !== oldStatus &&
      (invoice.status === "paid" || invoice.status === "partial")
    ) {
      const customer = await Customer.findById(invoice.customerId); // NO SESSION
      if (customer) {
        // Calculate points earned from payment
        const POINTS_RATE = 10;
        const pointsEarned =
          invoice.paidAmount > 0
            ? Math.floor(invoice.paidAmount / POINTS_RATE)
            : 0;

        // Update customer earned points
        customer.totalPointsEarned =
          (customer.totalPointsEarned || 0) + pointsEarned;
        customer.availablePoints =
          (customer.availablePoints || 0) + pointsEarned;
        customer.lastPointsEarnedDate = new Date();
        await customer.save(); // NO SESSION
      }
    }

    // Populate for response
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate("customerId", "name phone email")
      .populate("createdBy", "firstName lastName")
      .populate("items.productId", "productName hsnCode");

    res.json({
      success: true,
      message: "Invoice updated successfully",
      invoice: populatedInvoice,
      changes: {
        pointsUsed: oldPointsUsed !== invoice.shoppingPointsUsed,
        paidAmount: oldPaidAmount !== invoice.paidAmount,
        status: oldStatus !== invoice.status,
      },
    });
  } catch (err) {
    console.error("Update invoice error:", err);

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

// Delete invoice - NO TRANSACTION VERSION
exports.deleteInvoice = async (req, res) => {
  try {
    // Validate invoice ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID format",
      });
    }

    const invoice = await Invoice.findById(req.params.id); // NO SESSION
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Store invoice data for cleanup
    const customerId = invoice.customerId;
    const shoppingPointsUsed = invoice.shoppingPointsUsed || 0;
    const paidAmount = invoice.paidAmount || 0;
    const items = invoice.items || [];

    // Return shopping points to customer
    if (shoppingPointsUsed > 0) {
      const customer = await Customer.findById(customerId); // NO SESSION
      if (customer) {
        customer.availablePoints =
          (customer.availablePoints || 0) + shoppingPointsUsed;
        customer.usedPoints = Math.max(
          0,
          (customer.usedPoints || 0) - shoppingPointsUsed,
        );
        await customer.save(); // NO SESSION
      }
    }

    // Deduct earned points from customer (if invoice was paid/partial)
    if (
      paidAmount > 0 &&
      (invoice.status === "paid" || invoice.status === "partial")
    ) {
      const customer = await Customer.findById(customerId); // NO SESSION
      if (customer) {
        const POINTS_RATE = 10;
        const pointsEarned = Math.floor(paidAmount / POINTS_RATE);

        customer.availablePoints = Math.max(
          0,
          (customer.availablePoints || 0) - pointsEarned,
        );
        customer.totalPointsEarned = Math.max(
          0,
          (customer.totalPointsEarned || 0) - pointsEarned,
        );
        await customer.save(); // NO SESSION
      }
    }

    // Restore product stock if needed
    for (const item of items) {
      if (item.productId) {
        const product = await Product.findById(item.productId); // NO SESSION
        // if (
        //   product &&
        //   product.stockQuantity !== undefined &&
        //   product.stockQuantity !== null
        // ) {
        //   product.openingQuantity += item.qty || 0;
        //   await product.save(); // NO SESSION
        // }
        if (product) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { stockQuantity: item.qty },
          });
        }
      }
    }

    // Update customer purchase history
    const customer = await Customer.findById(customerId); // NO SESSION
    if (customer) {
      customer.totalPurchases = Math.max(0, (customer.totalPurchases || 0) - 1);
      customer.totalPurchaseAmount = Math.max(
        0,
        (customer.totalPurchaseAmount || 0) - (invoice.grandTotal || 0),
      );

      // Recalculate average order value
      if (customer.totalPurchases > 0) {
        customer.averageOrderValue =
          customer.totalPurchaseAmount / customer.totalPurchases;
      } else {
        customer.averageOrderValue = 0;
      }

      await customer.save(); // NO SESSION
    }

    // Delete attachments from Cloudinary
    if (invoice.attachments && invoice.attachments.length > 0) {
      const deletePromises = invoice.attachments
        .filter((attachment) => attachment.public_id)
        .map((attachment) =>
          cloudinary.uploader.destroy(attachment.public_id).catch((err) => {
            console.error(
              `Failed to delete Cloudinary file ${attachment.public_id}:`,
              err.message,
            );
            // Continue even if deletion fails
          }),
        );

      await Promise.allSettled(deletePromises);
    }

    // Delete the invoice
    await Invoice.findByIdAndDelete(req.params.id); // NO SESSION
    await updateCustomerDueAmount(customerId);

    res.json({
      success: true,
      message: "Invoice deleted successfully",
      deleted: {
        invoiceId: req.params.id,
        invoiceNo: invoice.invoiceNo,
        pointsReturned: shoppingPointsUsed,
        stockRestored: items.length,
        attachmentsDeleted: invoice.attachments?.length || 0,
      },
    });
  } catch (err) {
    console.error("Delete invoice error:", err);

    res.status(500).json({
      success: false,
      error: "Failed to delete invoice",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Add payment to invoice - NO TRANSACTION VERSION
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

    const invoice = await Invoice.findById(req.params.id); // NO SESSION
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Check if invoice is already fully paid
    if (invoice.status === "paid" && invoice.dueAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invoice is already fully paid",
        dueAmount: invoice.dueAmount,
        paidAmount: invoice.paidAmount,
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

    // Store old values for comparison
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

    await invoice.save(); // NO SESSION
    await updateCustomerDueAmount(invoice.customerId);

    // Calculate points earned from this payment (1 point per ₹10)
    const POINTS_RATE = 10;
    const pointsEarned = Math.floor(paymentAmount / POINTS_RATE);

    // Update customer points if points were earned
    if (pointsEarned > 0) {
      const customer = await Customer.findById(invoice.customerId); // NO SESSION
      if (customer) {
        customer.availablePoints =
          (customer.availablePoints || 0) + pointsEarned;
        customer.totalPointsEarned =
          (customer.totalPointsEarned || 0) + pointsEarned;
        customer.lastPointsEarnedDate = new Date();

        // Update payment history
        if (!customer.paymentHistory) {
          customer.paymentHistory = [];
        }

        customer.paymentHistory.push({
          date: new Date(),
          invoiceId: invoice._id,
          invoiceNo: invoice.invoiceNo,
          amount: paymentAmount,
          pointsEarned: pointsEarned,
        });

        await customer.save(); // NO SESSION
      }
    }

    // Populate for response
    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate("customerId", "name phone")
      .populate("createdBy", "firstName lastName");

    res.json({
      success: true,
      message: "Payment added successfully",
      invoice: populatedInvoice,
      payment: {
        amount: paymentAmount,
        pointsEarned: pointsEarned,
        previousPaid: oldPaidAmount,
        newPaid: invoice.paidAmount,
        previousDue: oldDueAmount,
        newDue: invoice.dueAmount,
        statusChanged: oldStatus !== invoice.status,
        newStatus: invoice.status,
      },
    });
  } catch (err) {
    console.error("Add payment error:", err);

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
        "paid",
        "partial",
        "cancelled",
        "overdue",
      ];
      if (allowedStatuses.includes(status)) {
        matchStage.status = status;
      }
    }

    // Handle date range
    if (startDate || endDate || period !== "all") {
      matchStage.invoiceDate = {};

      // Validate and set start date
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid start date format",
          });
        }
        matchStage.invoiceDate.$gte = start;
      } else if (period !== "all") {
        // Set default start based on period
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

      // Validate and set end date
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid end date format",
          });
        }
        matchStage.invoiceDate.$lte = end;
      }
    }

    // Main stats aggregation
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
          totalPointsUsed: { $sum: "$shoppingPointsUsed" },
          totalPointsValue: {
            $sum: { $multiply: ["$shoppingPointsUsed", "$pointValue"] },
          },
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
          totalPointsUsed: 1,
          totalPointsValue: { $round: ["$totalPointsValue", 2] },
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

    // Monthly breakdown (last 12 months)
    const monthlyBreakdown = await Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$invoiceDate" },
            month: { $month: "$invoiceDate" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
          totalPaid: { $sum: "$paidAmount" },
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
          totalPaid: { $round: ["$totalPaid", 2] },
        },
      },
    ]);

    // Top customers by invoice count
    const topCustomers = await Invoice.aggregate([
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
          invoiceCount: { $sum: 1 },
          totalSpent: { $sum: "$grandTotal" },
          avgInvoiceValue: { $avg: "$grandTotal" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          customerId: "$_id",
          customerName: 1,
          invoiceCount: 1,
          totalSpent: { $round: ["$totalSpent", 2] },
          avgInvoiceValue: { $round: ["$avgInvoiceValue", 2] },
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
        totalPointsUsed: 0,
        totalPointsValue: 0,
        avgInvoiceValue: 0,
        maxInvoiceValue: 0,
        minInvoiceValue: 0,
        paymentEfficiency: 0,
      },
      statusCounts,
      monthlyBreakdown,
      topCustomers,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        customerId: customerId || null,
        status: status || null,
        period: period,
      },
    });
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch statistics",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Get invoices by customer
exports.getInvoicesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { status, startDate, endDate, limit = 50 } = req.query;

    // Validate customer ID
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid customer ID format",
      });
    }

    // Build filter
    const filter = { customerId };

    // Add status filter if provided
    if (status && status !== "all") {
      filter.status = status;
    }

    // Add date range filter
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }

    // Get invoices
    const invoices = await Invoice.find(filter)
      .select(
        "invoiceNo invoiceDate dueDate grandTotal paidAmount dueAmount status paymentMethod",
      )
      .sort({ invoiceDate: -1 })
      .limit(parseInt(limit));

    // Calculate summary
    const summary = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
      totalPaid: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
      totalDue: invoices.reduce((sum, inv) => sum + inv.dueAmount, 0),
    };

    res.json({
      success: true,
      count: invoices.length,
      summary,
      invoices,
    });
  } catch (error) {
    console.error("Get customer invoices error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch customer invoices",
    });
  }
};

// Get overdue invoices by customer
exports.getOverdueInvoicesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const today = new Date();

    // Validate customer ID
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid customer ID format",
      });
    }

    // Find overdue invoices (due date passed and not fully paid)
    const overdueInvoices = await Invoice.find({
      customerId,
      dueDate: { $lt: today },
      dueAmount: { $gt: 0 },
      status: { $in: ["sent", "partial"] },
    })
      .select(
        "invoiceNo invoiceDate dueDate grandTotal paidAmount dueAmount status",
      )
      .sort({ dueDate: 1 });

    // Calculate total overdue amount
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
    console.error("Get overdue invoices error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch overdue invoices",
    });
  }
};

// Get unpaid invoices by customer
exports.getUnpaidInvoicesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Validate customer ID
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid customer ID format",
      });
    }

    // Find unpaid or partially paid invoices
    const unpaidInvoices = await Invoice.find({
      customerId,
      dueAmount: { $gt: 0 },
      status: { $in: ["sent", "partial"] },
    })
      .select(
        "invoiceNo invoiceDate dueDate grandTotal paidAmount dueAmount status",
      )
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      count: unpaidInvoices.length,
      invoices: unpaidInvoices,
    });
  } catch (error) {
    console.error("Get unpaid invoices error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch unpaid invoices",
    });
  }
};

// Get sales list with product details
exports.getSalesList = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      customerId,
      status,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter
    const filter = {};

    // Date filter
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }

    // Customer filter
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      filter.customerId = customerId;
    }

    // Status filter - FIXED FOR "due" TAB
    if (status && status !== "all") {
      if (status === "due") {
        // For "due" tab, filter by dueAmount > 0
        filter.dueAmount = { $gt: 0 };
      } else if (status === "recent") {
        // For "recent" tab, get invoices from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filter.invoiceDate = { $gte: sevenDaysAgo };
      } else {
        // For other statuses like "paid", "draft", etc.
        filter.status = status;
      }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { invoiceNo: { $regex: search, $options: "i" } },
        { "customerId.name": { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get invoices with populated data
    const invoices = await Invoice.find(filter)
      .populate("customerId", "name phone email")
      .populate({
        path: "items.productId",
        select: "productName  category  hsn itemBarcode sellingPrice",
        populate: [
          {
            path: "category",
            select: "categoryName",
          },
          {
            path: "hsn",
            select: "hsnCode",
          },
        ],
      })
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Count total
    const total = await Invoice.countDocuments(filter);

    // Calculate summary statistics
    const stats = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalOrders: { $sum: 1 },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$dueAmount" },
          avgOrderValue: { $avg: "$grandTotal" },
        },
      },
    ]);

    // Format response
    const salesList = invoices.map((invoice) => {
      // Calculate sold items count
      const soldItems = invoice.items.reduce((sum, item) => sum + item.qty, 0);

      return {
        _id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        customer: invoice.customerId?.name || "N/A",
        soldItems,
        totalAmount: invoice.grandTotal,
        status: invoice.status,
        dueAmount: invoice.dueAmount,
        invoiceDate: invoice.invoiceDate,
        paymentMethod: invoice.paymentMethod,
        // Include all items for expanded view
        items: invoice.items.map((item) => ({
          productId: item.productId?._id || item.productId, // Include raw ID
          productName: item.productId?.productName || item.itemName,
          hsn: item.productId?.hsn?.hsnCode || "N/A",
          qty: item.qty,
          itemBarcode: item.productId?.itemBarcode || "N/A",
          category: item.productId?.category?.categoryName || "N/A",
          unitPrice: item.unitPrice,
          total: item.amount,
        })),
      };
    });

    res.json({
      success: true,
      data: {
        sales: salesList,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        stats: stats[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          totalPaid: 0,
          totalDue: 0,
          avgOrderValue: 0,
        },
      },
    });
  } catch (error) {
    console.error("Get sales list error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch sales list",
    });
  }
};

exports.sendThroughEmail = async (req, res) => {
  try {
    const { invoiceId, toEmail, subject, type = "sales" } = req.body;

    // console.log("📧 Email sending request received:", {
    //   invoiceId,
    //   toEmail,
    //   subject,
    //   type,
    // });

    // Validate inputs
    if (!toEmail || !invoiceId) {
      return res.status(400).json({
        success: false,
        message: "Recipient email and invoice ID are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // 1. Fetch invoice data
    let invoice;
    if (type === "purchase") {
      // For purchase orders
      const PurchaseOrder = require("../models/PurchaseOrder"); // Adjust path as needed
      invoice = await PurchaseOrder.findById(invoiceId).populate(
        "supplierId",
        "supplierName email phone address",
      );
    } else {
      // For sales invoices
      const Invoice = require("../models/Invoice"); // Adjust path as needed
      invoice = await Invoice.findById(invoiceId).populate(
        "customerId",
        "name email phone address",
      );
    }

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // console.log("📄 Invoice found:", invoice.invoiceNo);

    // 2. Get company info from database or use defaults
    const Company = require("../models/CompanyProfile"); // Adjust path as needed
    const company = await Company.findOne();

    const companyName = company?.companyName || "Your Company";
    const companyEmail =
      company?.companyemail ||
      process.env.EMAIL_USER ||
      "madhav005542@gmail.com";
    const companyPhone = company?.companyphone || "";
    const companyAddress = company?.companyaddress || "";
    const companyLogo = company?.companyLogo || "";

    // 3. Prepare email content
    const emailSubject =
      subject ||
      `${type === "purchase" ? "Purchase" : "Sales"} Invoice - ${invoice.invoiceNo}`;

    // Create HTML email template
    const emailHtml = createInvoiceEmailTemplate(
      invoice,
      companyName,
      companyEmail,
      companyPhone,
      type,
    );

    // 4. Send email
    const emailResult = await sendEmailWithNodemailer(
      toEmail,
      emailSubject,
      emailHtml,
      invoice,
    );

    if (emailResult.success) {
      // Update invoice status
      if (type === "purchase") {
        await PurchaseOrder.findByIdAndUpdate(invoiceId, {
          $set: {
            status: "sent",
            sentAt: new Date(),
            sentVia: "email",
          },
        });
      } else {
        await Invoice.findByIdAndUpdate(invoiceId, {
          $set: {
            status: "sent",
            sentAt: new Date(),
            sentVia: "email",
          },
        });
      }

      return res.json({
        success: true,
        message: `Invoice sent via email to ${toEmail}`,
        data: {
          email: toEmail,
          invoiceNo: invoice.invoiceNo,
          timestamp: new Date().toISOString(),
          type: type,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to send email",
        error: emailResult.error,
      });
    }
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    console.error(error.stack);

    res.status(500).json({
      success: false,
      message: "Failed to process email request",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Function to create email template
function createInvoiceEmailTemplate(
  invoice,
  companyName,
  companyEmail,
  companyPhone,
  type,
) {
  const invoiceDate = invoice.invoiceDate
    ? new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  const customerName =
    type === "purchase"
      ? invoice.supplierId?.supplierName || "Supplier"
      : invoice.customerId?.name || "Customer";

  const itemsHtml =
    invoice.items && invoice.items.length > 0
      ? invoice.items
          .map(
            (item, index) => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${index + 1}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.itemName || item.name || "N/A"}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.qty || 0}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.unitPrice?.toFixed(2) || "0.00"}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.amount?.toFixed(2) || "0.00"}</td>
            </tr>
        `,
          )
          .join("")
      : '<tr><td colspan="5" style="padding: 8px; text-align: center;">No items</td></tr>';

  return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice ${invoice.invoiceNo}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 5px 5px 0 0;
                    text-align: center;
                }
                .content {
                    padding: 20px;
                    background: #f9f9f9;
                    border-radius: 0 0 5px 5px;
                }
                .invoice-details {
                    background: white;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-left: 4px solid #667eea;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                th {
                    background: #f5f5f5;
                    padding: 10px;
                    text-align: left;
                    border-bottom: 2px solid #ddd;
                }
                .total-section {
                    background: white;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-top: 2px solid #667eea;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #666;
                    font-size: 12px;
                }
                .btn {
                    display: inline-block;
                    background: #667eea;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 10px 0;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">${companyName}</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">${type === "purchase" ? "Purchase Invoice" : "Tax Invoice"}</p>
            </div>
            
            <div class="content">
                <p>Dear ${customerName},</p>
                <p>Please find your invoice details below:</p>
                
                <div class="invoice-details">
                    <h3 style="margin-top: 0; color: #667eea;">Invoice Summary</h3>
                    <p><strong>Invoice No:</strong> ${invoice.invoiceNo || "N/A"}</p>
                    <p><strong>Date:</strong> ${invoiceDate}</p>
                    <p><strong>Status:</strong> <span style="color: ${invoice.status === "paid" ? "#28a745" : invoice.status === "pending" ? "#ffc107" : "#dc3545"}; font-weight: bold;">
                        ${invoice.status?.toUpperCase() || "PENDING"}
                    </span></p>
                </div>
                
                <h3>Items Details</h3>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Item Name</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                
                <div class="total-section">
                    <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                        <span><strong>Subtotal:</strong></span>
                        <span><strong>₹${invoice.subtotal?.toFixed(2) || "0.00"}</strong></span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                        <span>Tax:</span>
                        <span>₹${invoice.totalTax?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                        <span>Discount:</span>
                        <span>₹${invoice.totalDiscount?.toFixed(2) || "0.00"}</span>
                    </div>
                    ${
                      invoice.shoppingPointsUsed > 0
                        ? `
                    <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                        <span>🪙 Shopping Points:</span>
                        <span>₹${invoice.shoppingPointsUsed?.toFixed(2) || "0.00"}</span>
                    </div>
                    `
                        : ""
                    }
                    <div style="display: flex; justify-content: space-between; margin: 5px 0; font-size: 18px; color: #667eea; padding-top: 10px; border-top: 1px solid #ddd;">
                        <span><strong>Total Amount:</strong></span>
                        <span><strong>₹${invoice.grandTotal?.toFixed(2) || "0.00"}</strong></span>
                    </div>
                    ${
                      invoice.dueAmount > 0
                        ? `
                    <div style="display: flex; justify-content: space-between; margin: 5px 0; color: #dc3545;">
                        <span><strong>Due Amount:</strong></span>
                        <span><strong>₹${invoice.dueAmount?.toFixed(2) || "0.00"}</strong></span>
                    </div>
                    `
                        : ""
                    }
                </div>
                
                <p>You can view and download the complete invoice by clicking the button below:</p>
                <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/invoices/${invoice._id}" class="btn">
                    View Complete Invoice
                </a>
                
                <p>If you have any questions about this invoice, please reply to this email or contact us.</p>
                
                <div class="footer">
                    <p><strong>${companyName}</strong></p>
                    ${companyAddress ? `<p>${companyAddress}</p>` : ""}
                    ${companyPhone ? `<p>Phone: ${companyPhone}</p>` : ""}
                    <p>Email: ${companyEmail}</p>
                    <p style="margin-top: 10px; font-size: 11px; color: #999;">
                        This is an automated email. Please do not reply directly to this message.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Function to send email using nodemailer
async function sendEmailWithNodemailer(
  toEmail,
  subject,
  htmlContent,
  invoiceData,
) {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email configuration missing");
      return {
        success: false,
        error: "Email configuration missing",
        simulated: true,
      };
    }

    // console.log("🔧 Configuring email transporter...");

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // madhav005542@gmail.com
        pass: process.env.EMAIL_PASS, // lfvu mxyh fnlc qqts
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection configuration
    // console.log("🔍 Verifying email configuration...");
    await transporter.verify();
    // console.log("✅ Email server is ready to take messages");

    // Prepare email options
    const mailOptions = {
      from: `"Invoice System" <${process.env.EMAIL_USER}>`, // From: madhav005542@gmail.com
      to: toEmail,
      subject: subject,
      html: htmlContent,
      text: `Invoice ${invoiceData.invoiceNo} - Total: ₹${invoiceData.grandTotal?.toFixed(2) || "0.00"}. Please view the HTML version for complete details.`,
      attachments: [], // You can add PDF attachment here if generated
    };

    // console.log("📤 Sending email...");
    // console.log("   From:", mailOptions.from);
    // console.log("   To:", mailOptions.to);
    // console.log("   Subject:", mailOptions.subject);

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // console.log("✅ Email sent successfully!");
    // console.log("   Message ID:", info.messageId);
    // console.log("   Response:", info.response);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    console.error("❌ Email sending failed:");
    console.error("   Error:", error.message);
    console.error("   Code:", error.code);
    console.error("   Command:", error.command);

    // Provide helpful error messages
    let errorMessage = error.message;
    if (error.code === "EAUTH") {
      errorMessage =
        "Email authentication failed. Check your email credentials.";
    } else if (error.code === "ECONNECTION") {
      errorMessage = "Connection to email server failed. Check your network.";
    }

    return {
      success: false,
      error: errorMessage,
      details: error,
    };
  }
}

exports.sendThroughSMS = async (req, res) => {
  try {
    const { invoiceId, phoneNumber, message } = req.body;
    // Send SMS using SMS service (Twilio, etc.)
    res.json({ success: true, message: "SMS sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// get overdue invoices
exports.getOverdueInvoices = async (req, res) => {
  try {
    const today = new Date();
    const overdueInvoices = await Invoice.find({
      dueDate: { $lt: today },
      status: { $in: ["sent", "partial"] },
      dueAmount: { $gt: 0 },
    })
      .populate("customerId", "name phone email")
      .sort({ dueDate: 1 });
    res.json({
      success: true,
      count: overdueInvoices.length,
      invoices: overdueInvoices,
    });
  } catch (error) {
    console.error("Get overdue invoices error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch overdue invoices",
    });
  }
};

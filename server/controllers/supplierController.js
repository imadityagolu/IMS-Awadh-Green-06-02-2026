const Supplier = require("../models/supplierModel");
const cloudinary = require("../utils/cloudinary/cloudinary");
const axios = require("axios");
const mongoose = require("mongoose");
const Invoice = require("../models/CreatePurchaseOrderModel");

// Create supplier
/* ===============================
   SANITIZATION + VALIDATION
================================ */

// sanitize any string input
const sanitize = (value = "") =>
  String(value)
    .trim()
    .replace(/<[^>]*>/g, "");

// validators
const isValidGSTIN = (gst) =>
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst);

const isValidPhone = (phone) => /^[6-9]\d{9}$/.test(phone);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPincode = (pin) => /^\d{6}$/.test(pin);

/* ===============================
   CREATE SUPPLIER
================================ */
exports.createSupplier = async (req, res) => {
  try {
    let {
      supplierName,
      businessType,
      gstin,
      phone,
      email,
      categoryBrand,
      address = {},
      bank = {},
      status = true,
    } = req.body;

    // ---------- SANITIZE ----------
    supplierName = sanitize(supplierName);
    businessType = sanitize(businessType);
    gstin = sanitize(gstin);
    phone = sanitize(phone);
    email = sanitize(email);
    categoryBrand = sanitize(categoryBrand);

    address = {
      addressLine: sanitize(address.addressLine),
      country: sanitize(address.country),
      state: sanitize(address.state),
      city: sanitize(address.city),
      pincode: sanitize(address.pincode),
    };

    bank = {
      bankName: sanitize(bank.bankName),
      accountNumber: sanitize(bank.accountNumber),
      ifsc: sanitize(bank.ifsc),
      branch: sanitize(bank.branch),
    };

    // ---------- VALIDATION ----------
    if (!supplierName)
      return res.status(400).json({ message: "Supplier name is required" });

    if (!businessType)
      return res.status(400).json({ message: "Business type is required" });

    if (!phone || !isValidPhone(phone))
      return res.status(400).json({ message: "Invalid phone number" });

    if (email && !isValidEmail(email))
      return res.status(400).json({ message: "Invalid email address" });

    if (gstin && !isValidGSTIN(gstin))
      return res.status(400).json({ message: "Invalid GSTIN" });

    if (address.pincode && !isValidPincode(address.pincode))
      return res.status(400).json({ message: "Invalid pincode" });

    // ---------- SUPPLIER CODE ----------
   // ---------- SUPPLIER CODE ----------
const lastSupplier = await Supplier
  .findOne()
  .sort({ createdAt: -1 })
  .select("supplierCode");

let supplierCode = "INV001";

if (lastSupplier?.supplierCode) {
  const lastNumber = parseInt(
    lastSupplier.supplierCode.replace("INV", ""),
    10
  );

  supplierCode = "INV" + String(lastNumber + 1).padStart(3, "0");
}


    // ---------- CREATE ----------
    const supplier = await Supplier.create({
      supplierCode,
      supplierName,
      businessType,
      gstin,
      phone,
      email,
      categoryBrand,
      address,
      bank,
      status,
    });

    res.status(201).json({
      message: "Supplier created successfully",
      supplier,
    });
  } catch (error) {
    console.error("Create Supplier Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all suppliers (LIST)
exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find(
      {},
      {
        supplierName: 1,
        email: 1,
        phone: 1,
        address: 1,
        categoryBrand: 1,
        businessType: 1,
        status: 1,
        createdAt: 1,
      }
    ).sort({ createdAt: -1 });

    // Get purchase order statistics for all suppliers
    const supplierIds = suppliers.map((s) => s._id);

    // Aggregate purchase orders to get financial data
    const purchaseStats = await Invoice.aggregate([
      {
        $match: {
          supplierId: { $in: supplierIds },
          status: { $ne: "draft" },
        },
      },
      {
        $group: {
          _id: "$supplierId",
          totalSpent: { $sum: "$grandTotal" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$dueAmount" },
          totalAdvance: { $sum: "$advanceAmount" },
          invoiceCount: { $sum: 1 },
        },
      },
    ]);

    // Create a map for quick lookup
    const statsMap = {};
    purchaseStats.forEach((stat) => {
      statsMap[stat._id.toString()] = {
        totalSpent: stat.totalSpent || 0,
        totalPaid: stat.totalPaid || 0,
        totalDue: stat.totalDue || 0,
        totalAdvance: stat.totalAdvance || 0,
        invoiceCount: stat.invoiceCount || 0,
        balance: (stat.totalAdvance || 0) - (stat.totalDue || 0), // Balance = Advance - Due
      };
    });

    // Temporary computed fields (IMS-friendly)
    const formatted = suppliers.map((s) => {
      const stats = statsMap[s._id.toString()] || {
        totalSpent: 0,
        totalPaid: 0,
        totalDue: 0,
        totalAdvance: 0,
        invoiceCount: 0,
        balance: 0,
      };
      return {
        _id: s._id,
        name: s.supplierName,
         email: s.email || "", 
        phone: s.phone,
        address: s.address || {},
        category: s.categoryBrand
          ? s.categoryBrand.split(",").map((c) => c.trim())
          : [],
        businessType: s.businessType,
        status: s.status,
        // Add the dynamic fields
        balance: stats.balance,
        totalSpent: stats.totalSpent,
        totalDue: stats.totalDue,
        totalAdvance: stats.totalAdvance,
        totalPaid: stats.totalPaid,
        invoiceCount: stats.invoiceCount,
      };
    });

    res.status(200).json({
      total: formatted.length,
      suppliers: formatted,
    });
  } catch (err) {
    console.error("Get suppliers error:", err);
    res.status(500).json({
      message: "Failed to fetch suppliers",
    });
  }
};

exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid supplier id" });
    }

    const supplier = await Supplier.findById(id);

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.status(200).json(supplier);
  } catch (err) {
    console.error("Get supplier error:", err);
    res.status(500).json({
      message: "Failed to fetch supplier",
    });
  }
};

// GET ACTIVE USERS
// Get only active suppliers for dropdown/modal
exports.getActiveSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find(
      { status: true },
      { supplierName: 1, supplierCode: 1 }
    ).sort({ supplierName: 1 });

    res.status(200).json({
      total: suppliers.length,
      suppliers,
    });
  } catch (error) {
    console.error("Get Active Suppliers Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update supplier
exports.updateSupplier = async (req, res) => {
  try {
    const {
      supplierName,
      businessType,
      phone,
      email,
      gstin,
      categoryBrand,
      address = {},
      bank = {},
      status,
    } = req.body;

    /* ================= SANITIZE ================= */
    const sanitize = (val = "") =>
      String(val)
        .trim()
        .replace(/<[^>]*>/g, "");

    const cleanData = {
      supplierName: sanitize(supplierName),
      businessType: sanitize(businessType),
      phone: sanitize(phone),
      email: sanitize(email),
      gstin: sanitize(gstin),
      categoryBrand: sanitize(categoryBrand),
      status: typeof status === "boolean" ? status : true,
      address: {
        addressLine: sanitize(address.addressLine),
        country: sanitize(address.country),
        state: sanitize(address.state),
        city: sanitize(address.city),
        pincode: sanitize(address.pincode),
      },
      bank: {
        bankName: sanitize(bank.bankName),
        accountNumber: sanitize(bank.accountNumber),
        ifsc: sanitize(bank.ifsc),
        branch: sanitize(bank.branch),
      },
    };

    /* ================= VALIDATION ================= */
    if (!cleanData.supplierName) {
      return res.status(400).json({ message: "Supplier name is required" });
    }

    if (!cleanData.businessType) {
      return res.status(400).json({ message: "Business type is required" });
    }

    if (!/^[6-9]\d{9}$/.test(cleanData.phone)) {
      return res.status(400).json({ message: "Invalid phone number" });
    }

    if (cleanData.email && !/^\S+@\S+\.\S+$/.test(cleanData.email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    if (
      cleanData.gstin &&
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(cleanData.gstin)
    ) {
      return res.status(400).json({ message: "Invalid GSTIN" });
    }

    if (
      cleanData.address.pincode &&
      !/^\d{6}$/.test(cleanData.address.pincode)
    ) {
      return res.status(400).json({ message: "Invalid pincode" });
    }

    /* ================= UPDATE ================= */
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      cleanData,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }

    res.status(200).json({
      message: "Supplier updated successfully",
      supplier,
    });
  } catch (error) {
    console.error("Update Supplier Error:", error);
    res.status(500).json({
      message: "Failed to update supplier",
      error: error.message,
    });
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ error: "Supplier not found" });
    res.json({ message: "Supplier deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to delete supplier", details: err.message });
  }
};

// Get supplier statistics
exports.getSupplierStatistics = async (req, res) => {
  try {
    const supplierId = req.params.id;

    // Get supplier with all fields
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: "Supplier not found" });
    }

    // Get all invoices for this supplier in one query with aggregation
    const invoiceStats = await Invoice.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(supplierId),
          status: { $ne: "draft" },
        },
      },
      {
        $facet: {
          // Calculate total due amount
          totalDueAmount: [
            {
              $group: {
                _id: null,
                total: { $sum: "$dueAmount" },
              },
            },
          ],
          // Count unpaid invoices
          unpaidInvoices: [
            {
              $match: { dueAmount: { $gt: 0 } },
            },
            {
              $count: "count",
            },
          ],
          // Count overdue invoices
          overdueInvoices: [
            {
              $match: {
                dueAmount: { $gt: 0 },
                dueDate: { $lt: new Date() },
              },
            },
            {
              $count: "count",
            },
          ],
          // Get invoice status counts
          statusCounts: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          // Get all invoices for recent purchases
          allInvoices: [
            {
              $sort: { invoiceDate: -1 },
            },
            {
              $limit: 50,
            },
            {
              $project: {
                _id: 1,
                invoiceNo: 1,
                invoiceDate: 1,
                grandTotal: 1,
                dueAmount: 1,
                status: 1,
                dueDate: 1,
                paidAmount: 1,
                paymentMethod: 1,
              },
            },
          ],
        },
      },
    ]);

    const stats = invoiceStats[0];

    // Extract values with defaults
    const totalDueAmount = stats.totalDueAmount[0]?.total || 0;
    const unpaidInvoices = stats.unpaidInvoices[0]?.count || 0;
    const overdueInvoices = stats.overdueInvoices[0]?.count || 0;
    const allInvoices = stats.allInvoices || [];

    // Create status count map
    const statusCounts = {};
    stats.statusCounts?.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    // Get recent purchases (last 5)
    const recentInvoices = allInvoices.slice(0, 5);

    // Update supplier's totalDueAmount in database if different
    if (supplier.totalDueAmount !== totalDueAmount) {
      supplier.totalDueAmount = totalDueAmount;
      // Also update other fields
      supplier.totalInvoices = allInvoices.length;
      supplier.totalPurchaseAmount = allInvoices.reduce(
        (sum, inv) => sum + inv.grandTotal,
        0
      );
      supplier.totalPaidAmount = allInvoices.reduce(
        (sum, inv) => sum + inv.paidAmount,
        0
      );
      await supplier.save();
    }

    // Calculate first invoice date (earliest invoice)
    let firstInvoiceDate = null;
    if (allInvoices.length > 0) {
      const sortedByDate = [...allInvoices].sort(
        (a, b) => new Date(a.invoiceDate) - new Date(b.invoiceDate)
      );
      firstInvoiceDate = sortedByDate[0].invoiceDate;
    }

    // Calculate last invoice
    let lastInvoiceDate = null;
    let lastPurchaseAmount = 0;
    if (allInvoices.length > 0) {
      const lastInvoice = allInvoices[0]; // Already sorted by date descending
      lastInvoiceDate = lastInvoice.invoiceDate;
      lastPurchaseAmount = lastInvoice.grandTotal;
    }

    // Format response
    const response = {
      supplier: {
        _id: supplier._id,
        supplierName: supplier.supplierName,
        phone: supplier.phone,
        email: supplier.email,
        businessType: supplier.businessType,
        address: supplier.address,
        gstin: supplier.gstin,
        categoryBrand: supplier.categoryBrand,
      },
      statistics: {
        // Purchase stats
        totalInvoices: allInvoices.length,
        totalPurchaseAmount: supplier.totalPurchaseAmount || 0,
        totalPaidAmount: supplier.totalPaidAmount || 0,
        totalDueAmount: totalDueAmount,
        averageOrderValue:
          supplier.totalPurchaseAmount / (allInvoices.length || 1),

        // First & last purchase dates
        firstInvoiceDate: firstInvoiceDate,
        lastInvoiceDate: lastInvoiceDate,
        lastPurchaseAmount: lastPurchaseAmount,

        // Invoice counts
        unpaidInvoices: unpaidInvoices,
        overdueInvoices: overdueInvoices,

        // Status breakdown
        paidInvoices: statusCounts.received || 0,
        partialInvoices: statusCounts.partial || 0,
        draftInvoices: statusCounts.draft || 0,
      },
      recentPurchases: recentInvoices.map((invoice) => ({
        _id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        date: invoice.invoiceDate,
        totalAmount: invoice.grandTotal,
        paidAmount: invoice.paidAmount || 0,
        dueAmount: invoice.dueAmount || 0,
        status: invoice.status,
        dueDate: invoice.dueDate,
        paymentMethod: invoice.paymentMethod || "cash",
        isOverdue:
          invoice.dueAmount > 0 && new Date(invoice.dueDate) < new Date(),
        isPartiallyPaid: invoice.status === "partial",
      })),
      summary: {
        totalInvoices: allInvoices.length,
        paidInvoices: statusCounts.received || 0,
        partialInvoices: statusCounts.partial || 0,
        draftInvoices: statusCounts.draft || 0,
        overdueInvoices: overdueInvoices,
        totalAmountOwed: totalDueAmount,
      },
    };

    res.json(response);
  } catch (err) {
    console.error("Get supplier statistics error:", err);
    res.status(500).json({ error: err.message });
  }
};

// Helper to update supplier stats when invoice changes
exports.updateSupplierStats = async (supplierId) => {
  try {
    const invoiceStats = await Invoice.aggregate([
      {
        $match: {
          supplierId: new mongoose.Types.ObjectId(supplierId),
          status: { $ne: "draft" },
        },
      },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalPurchaseAmount: { $sum: "$grandTotal" },
          totalPaidAmount: { $sum: "$paidAmount" },
          totalDueAmount: { $sum: "$dueAmount" },
        },
      },
    ]);

    const stats = invoiceStats[0] || {};

    await Supplier.findByIdAndUpdate(supplierId, {
      totalInvoices: stats.totalInvoices || 0,
      totalPurchaseAmount: stats.totalPurchaseAmount || 0,
      totalPaidAmount: stats.totalPaidAmount || 0,
      totalDueAmount: stats.totalDueAmount || 0,
    });

    return stats;
  } catch (err) {
    console.error("Error updating supplier stats:", err);
    throw err;
  }
};

// Recalculate supplier due amount
exports.recalculateSupplierDue = async (req, res) => {
  try {
    const supplierId = req.params.id;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    const stats = await exports.updateSupplierStats(supplierId);

    res.json({
      success: true,
      message: "Supplier statistics recalculated successfully",
      statistics: stats,
      supplier: {
        id: supplier._id,
        supplierName: supplier.supplierName,
        phone: supplier.phone,
      },
    });
  } catch (err) {
    console.error("Recalculate supplier due error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to recalculate supplier statistics",
      message: err.message,
    });
  }
};

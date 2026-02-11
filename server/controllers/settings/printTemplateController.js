const PrintTemplate = require("../../models/settings/printTemplateModel");
const CompanySetting = require("../../models/settings/companysettingmodal");
const Product = require("../../models/productModels");
const Customer = require("../../models/customerModel");
const cloudinary = require("../../utils/cloudinary/cloudinary");
const upload = require("../../config/upload.js");

// Get print template with all referenced data
exports.getPrintTemplate = async (req, res) => {
  try {
    const { type = "normal" } = req.query;
    const { includeData = "true" } = req.query;
    const userCompanyId = req.user.companyId;
        let template;

    // FIRST: Try to find company-specific template
    if (userCompanyId) {
      template = await PrintTemplate.findOne({
        templateType: type,
        companyId: userCompanyId,
        isActive: true,
      });
    }
        // SECOND: If no company-specific template found, get default template
    if (!template) {
      template = await PrintTemplate.findOne({
        templateType: type,
        isDefault: true,
        isActive: true,
      });
    }

    // THIRD: Create default template if none exists
    if (!template) {
      template = await createDefaultTemplate(type);
    }

    const response = {
      success: true,
      data: {
        template: template,
      },
    };

    // If requested, fetch all related data
    if (includeData === "true") {
      // Fetch company data
    const company = userCompanyId 
        ? await CompanySetting.findById(userCompanyId)
        : await CompanySetting.findOne();

      // Fetch sample products for preview
      const sampleProducts = await Product.find({ isDelete: false })
        .limit(5)
        .populate("category", "categoryName")
        .populate("subcategory", "subCategoryName")
        .populate("hsn", "hsnCode");

      // Fetch sample customer for preview
      const sampleCustomer = await Customer.findOne();

      response.data.company = company;
      response.data.sampleProducts = sampleProducts;
      response.data.sampleCustomer = sampleCustomer;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching print template:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching print template settings",
      error: error.message,
    });
  }
};

// Update print template (only template-specific settings)
exports.updatePrintTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userCompanyId = req.user.companyId;
    const companyId = userCompanyId || updateData.companyId;

    console.log("Update request:", { id, companyId, selectedTemplate: updateData.selectedTemplate });

    let template;

    if (id && id !== "undefined") {
      // If ID is provided, find and update that specific template
      template = await PrintTemplate.findById(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Template not found",
        });
      }
    } else {
      // Try to find existing template for this company with the same selectedTemplate
      template = await PrintTemplate.findOne({
        companyId: companyId,
        templateType: updateData.templateType || "normal",
        selectedTemplate: updateData.selectedTemplate || "template1"
      });

      console.log("Found template for company:", template ? template._id : "none");

      if (!template) {
        // If no template found, find the DEFAULT template to copy
        const defaultTemplate = await PrintTemplate.findOne({
          templateType: updateData.templateType || "normal",
          selectedTemplate: updateData.selectedTemplate || "template1",
          isDefault: true
        });

        console.log("Found default template:", defaultTemplate ? defaultTemplate._id : "none");

        if (defaultTemplate) {
          // Create a COPY of default template for this company
          template = new PrintTemplate({
            templateType: defaultTemplate.templateType,
            selectedTemplate: defaultTemplate.selectedTemplate,
            layoutConfig: defaultTemplate.layoutConfig,
            fieldVisibility: updateData.fieldVisibility || defaultTemplate.fieldVisibility,
            templateName: updateData.templateName || `Custom ${defaultTemplate.templateType} Template`,
            signatureUrl: updateData.signatureUrl || "",
            companyId: companyId,
            isDefault: false, // IMPORTANT: This is NOT a default template
            isActive: true
          });
        } else {
          // Create completely new template
          template = new PrintTemplate({
            templateType: updateData.templateType || "normal",
            companyId: companyId,
            templateName: updateData.templateName || `Custom ${updateData.templateType || "normal"} Template`,
            selectedTemplate: updateData.selectedTemplate || "template1",
            fieldVisibility: updateData.fieldVisibility || {},
            signatureUrl: updateData.signatureUrl || "",
            layoutConfig: updateData.layoutConfig || {},
            isDefault: false,
            isActive: true
          });
        }
      }
    }

    // Update template fields - but NEVER update isDefault to true for company templates
    const templateFields = [
      "templateName",
      "selectedTemplate",
      "layoutConfig",
      "fieldVisibility",
      "isActive",
      "signatureUrl",
    ];

    templateFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        template[field] = updateData[field];
      }
    });

    // Ensure isDefault is false for company templates
    if (companyId) {
      template.companyId = companyId;
      template.isDefault = false; // Company templates are never default
    }

    await template.save();

    console.log("Template saved:", template._id, "isDefault:", template.isDefault);

    res.status(200).json({
      success: true,
      message: "Print template updated successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error updating print template:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating print template",
      error: error.message,
    });
  }
};

// Upload signature image
exports.uploadSignature = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "invoice-signatures",
      resource_type: "image",
      transformation: [
        { width: 500, height: 200, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    // Delete the temporary file
    const fs = require("fs");
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).json({
      success: true,
      message: "Signature uploaded successfully",
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    console.error("Error uploading signature:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading signature",
      error: error.message,
    });
  }
};

// Delete signature
exports.deleteSignature = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Public ID is required",
      });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      res.status(200).json({
        success: true,
        message: "Signature deleted successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to delete signature",
      });
    }
  } catch (error) {
    console.error("Error deleting signature:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting signature",
      error: error.message,
    });
  }
};

// Generate invoice preview with dynamic data
exports.generatePreview = async (req, res) => {
  try {
    const { templateId, invoiceData } = req.body;

    // Get template
    const template = await PrintTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Fetch all required data
    const [company, customer, products] = await Promise.all([
      // Get company data (either from template reference or default)
      template.companyId
        ? CompanySetting.findById(template.companyId)
        : CompanySetting.findOne(),

      // Get customer data
      invoiceData?.customerId
        ? Customer.findById(invoiceData.customerId)
        : Customer.findOne(),

      // Get product data
      invoiceData?.productIds?.length > 0
        ? Product.find({
            _id: { $in: invoiceData.productIds },
            isDelete: false,
          })
            .populate("category", "categoryName")
            .populate("subcategory", "subCategoryName")
            .populate("hsn", "hsnCode")
        : Product.find({ isDelete: false })
            .limit(3)
            .populate("category", "categoryName")
            .populate("subcategory", "subCategoryName")
            .populate("hsn", "hsnCode"),
    ]);

    // Generate preview data structure
    const previewData = {
      template: template,
      company: company,
      customer: customer,
      products: products,
      invoice: {
        number: invoiceData?.invoiceNumber || "INV-001",
        date: invoiceData?.date || new Date().toISOString().split("T")[0],
        time: invoiceData?.time || new Date().toLocaleTimeString(),
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
      },
    };

    // Calculate totals
    if (products && products.length > 0) {
      previewData.invoice.subtotal = products.reduce(
        (sum, product) => sum + (product.sellingPrice || 0),
        0,
      );

      // Add sample tax (18%)
      previewData.invoice.tax = previewData.invoice.subtotal * 0.18;
      previewData.invoice.total =
        previewData.invoice.subtotal + previewData.invoice.tax;
    }

    res.status(200).json({
      success: true,
      data: previewData,
    });
  } catch (error) {
    console.error("Error generating preview:", error);
    res.status(500).json({
      success: false,
      message: "Error generating preview",
      error: error.message,
    });
  }
};

// Get all templates
exports.getAllTemplates = async (req, res) => {
  try {
    const { type } = req.query;
    const query = { isActive: true };

    if (type) {
      query.templateType = type;
    }

    const templates = await PrintTemplate.find(query)
      .sort({ isDefault: -1, updatedAt: -1 })
      .populate("companyId", "companyName companyLogo");

    res.status(200).json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching templates",
      error: error.message,
    });
  }
};

// Create default template
async function createDefaultTemplate(type) {
  const defaultTemplate = new PrintTemplate({
    templateType: type,
    templateName: `Default ${
      type === "normal" ? "Normal" : "Thermal"
    } Template`,
    selectedTemplate: "template1",
    fieldVisibility: {
      showHSN: true,
      showRate: true,
      showTax: true,
      showDate: true,
      showTime: true,
      showTotalsInWords: type === "normal",
      showBankDetails: type === "normal",
      showTermsConditions: type === "normal",
      showPaymentMode: type === "thermal",
      showDueAmount: type === "thermal",
      showRewardEarned: type === "thermal",
      showGreetings: type === "thermal",
    },
    layoutConfig: {
      headerPosition: "center",
      footerPosition: "center",
      fontSize: type === "thermal" ? 10 : 12,
      margin: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
      },
    },
    isDefault: true,
  });

  return await defaultTemplate.save();
}

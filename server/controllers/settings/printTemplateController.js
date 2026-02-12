const mongoose = require("mongoose");
const PrintTemplate = require("../../models/settings/printTemplateModel");
const CompanySetting = require("../../models/settings/companysettingmodal");
const Product = require("../../models/productModels");
const Customer = require("../../models/customerModel");
const cloudinary = require("../../utils/cloudinary/cloudinary");
const upload = require("../../config/upload.js");

exports.getPrintTemplate = async (req, res) => {
  try {
    const { type = "normal" } = req.query;
    const { includeData = "true" } = req.query;
    const userCompanyId = req.user?.companyId?._id || req.user?.companyId;

    // Log the actual company document to verify it exists
    if (userCompanyId) {
      const companyDoc = await CompanySetting.findById(userCompanyId).lean();
    }

    // Log all templates in the database for this type
    const allTemplatesForType = await PrintTemplate.find({
      templateType: type,
    }).lean();
    allTemplatesForType.forEach((t, index) => {
    });

    let template;
    let isDefaultTemplate = false;

    // FIRST: Try to find company-specific template with multiple matching strategies
    if (userCompanyId) {
      const companyIdStr = userCompanyId.toString();

      // Try multiple query strategies
      template = await PrintTemplate.findOne({
        templateType: type,
        $or: [
          { companyId: userCompanyId }, // Try as ObjectId
          { companyId: companyIdStr }, // Try as string
          { companyId: new mongoose.Types.ObjectId(userCompanyId) }, // Try as new ObjectId
        ],
        isActive: true,
      });

      if (template) {
      } else {

        // Additional debug: Check if any template has this companyId in any format
        const exactMatch = await PrintTemplate.findOne({
          templateType: type,
          companyId: companyIdStr,
        }).lean();


        const objectIdMatch = await PrintTemplate.findOne({
          templateType: type,
          companyId: userCompanyId,
        }).lean();


        const newObjectIdMatch = await PrintTemplate.findOne({
          templateType: type,
          companyId: new mongoose.Types.ObjectId(userCompanyId),
        }).lean();

      }
    }

    // SECOND: If no company-specific template found, get default template
    if (!template) {
      template = await PrintTemplate.findOne({
        templateType: type,
        isDefault: true,
        isActive: true,
      }).sort({ createdAt: -1 });

      if (template) {
        isDefaultTemplate = true;
      } else {
        console.log(`❌ No default ${type} template found`);
      }
    }

    // THIRD: Create default template if none exists (only if no templates at all)
    if (!template) {
      template = await createDefaultTemplate(type);
    }

    const response = {
      success: true,
      data: {
        template: template,
        isDefault: isDefaultTemplate,
      },
    };

    // If requested, fetch all related data
    if (includeData === "true" && template) {
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

// In printTemplateController.js - UPDATE updatePrintTemplate:
exports.updatePrintTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    // FIX: Get userCompanyId from req.user
    const userCompanyId = req.user?.companyId;
    const companyId = userCompanyId || updateData.companyId;

    let template;

    if (id && id !== "undefined" && id !== "null") {
      template = await PrintTemplate.findById(id);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Template not found",
        });
      }
    } else {
      template = await PrintTemplate.findOne({
        companyId: companyId,
        templateType: updateData.templateType || "normal",
      });
    }

    // FIX: Always provide default layoutConfig.margin
    const defaultLayoutConfig = {
      headerPosition: "center",
      footerPosition: "center",
      fontSize: 12,
      margin: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
      },
    };

    if (!template) {
      // Create new template
      template = new PrintTemplate({
        templateType: updateData.templateType || "normal",
        companyId: companyId,
        templateName:
          updateData.templateName ||
          `Custom ${updateData.templateType || "normal"} Template`,
        selectedTemplate: updateData.selectedTemplate || "template1",
        fieldVisibility: updateData.fieldVisibility || {},
        signatureUrl: updateData.signatureUrl || "",
        layoutConfig: updateData.layoutConfig || defaultLayoutConfig,
        isDefault: false,
        isActive: true,
      });
    } else {
      // Update existing template
      if (updateData.selectedTemplate !== undefined) {
        template.selectedTemplate = updateData.selectedTemplate;
      }

      if (updateData.fieldVisibility !== undefined) {
        template.fieldVisibility = {
          ...template.fieldVisibility,
          ...updateData.fieldVisibility,
        };
      }

      if (updateData.signatureUrl !== undefined) {
        template.signatureUrl = updateData.signatureUrl;
      }

      if (updateData.templateName !== undefined) {
        template.templateName = updateData.templateName;
      }

      // FIX: Handle layoutConfig with margin
      if (updateData.layoutConfig !== undefined) {
        template.layoutConfig = {
          ...defaultLayoutConfig,
          ...template.layoutConfig,
          ...updateData.layoutConfig,
          margin: {
            ...defaultLayoutConfig.margin,
            ...(template.layoutConfig?.margin || {}),
            ...(updateData.layoutConfig?.margin || {}),
          },
        };
      } else {
        // Ensure layoutConfig exists with margin
        if (!template.layoutConfig) {
          template.layoutConfig = defaultLayoutConfig;
        } else if (!template.layoutConfig.margin) {
          template.layoutConfig.margin = defaultLayoutConfig.margin;
        }
      }
    }

    // Ensure isDefault is false for company templates
    if (companyId) {
      template.companyId = companyId;
      template.isDefault = false;
    }

    await template.save();

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

// In printTemplateController.js - UPDATE getAllTemplates:
exports.getAllTemplates = async (req, res) => {
  try {
    const { type } = req.query;
    const userCompanyId = req.user?.companyId;

    const query = { isActive: true };

    if (type) {
      query.templateType = type;
    }

    // If user has companyId, get their templates AND default templates
    if (userCompanyId) {
      const templates = await PrintTemplate.find({
        $or: [
          { companyId: userCompanyId, isActive: true },
          { isDefault: true, isActive: true },
        ],
        ...(type && { templateType: type }),
      })
        .sort({ isDefault: -1, updatedAt: -1 })
        .populate("companyId", "companyName companyLogo");

      return res.status(200).json({
        success: true,
        data: templates,
        count: templates.length,
      });
    } else {
      // No company, just get default templates
      const templates = await PrintTemplate.find({
        isDefault: true,
        isActive: true,
        ...(type && { templateType: type }),
      })
        .sort({ updatedAt: -1 })
        .populate("companyId", "companyName companyLogo");

      return res.status(200).json({
        success: true,
        data: templates,
        count: templates.length,
      });
    }
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching templates",
      error: error.message,
    });
  }
};

// In printTemplateController.js - UPDATE createDefaultTemplate:
async function createDefaultTemplate(type) {
  // Check if a default template already exists
  const existingDefault = await PrintTemplate.findOne({
    templateType: type,
    isDefault: true,
    isActive: true,
  });

  if (existingDefault) {

    return existingDefault;
  }

  const defaultTemplate = new PrintTemplate({
    templateType: type,
    templateName: `Default ${type === "normal" ? "Normal" : "Thermal"} Template`,
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

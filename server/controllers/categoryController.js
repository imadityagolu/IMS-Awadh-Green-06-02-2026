// controllers/categoryController.js
const Category = require("../models/categoryModels");
const Subcategory = require("../models/subCateoryModal");
const Product = require("../models/productModels");

const escapeRegex = (text) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.createCategory = async (req, res) => {
  try {
    const { categoryName, subCategoryName } = req.body;

    if (!categoryName || !categoryName.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const cleanCategoryName = categoryName.trim();
    const escapedName = escapeRegex(cleanCategoryName);

    const existingCategory = await Category.findOne({
      categoryName: { $regex: `^${escapedName}$`, $options: "i" },
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    // 1️⃣ Create Category
    const category = await Category.create({
      categoryName: categoryName.trim(),
    });

    // 2️⃣ OPTIONAL Subcategory create
    if (subCategoryName && subCategoryName.trim()) {
      const subcategory = await Subcategory.create({
        name: subCategoryName.trim(),
        category: category._id,
      });

      category.subcategories.push(subcategory._id);
      await category.save();
    }

    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("🔥 CREATE CATEGORY ERROR:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const generateCategoryCode = async () => {
  const lastCategory = await Category.findOne().sort({ createdAt: -1 });

  if (!lastCategory || !lastCategory.categoryCode) {
    return "CAT-0001";
  }

  const lastCodeNum = parseInt(lastCategory.categoryCode.split("-")[1], 10);
  const newCodeNum = lastCodeNum + 1;

  return `CAT-${String(newCodeNum).padStart(4, "0")}`;
};

exports.bulkAssignCategoryCodes = async (req, res) => {
  try {
    const { selectedIds } = req.body;

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res.status(400).json({ message: "No categories selected" });
    }

    const categories = await Category.find({ _id: { $in: selectedIds } }).sort({
      createdAt: 1,
    });

    for (let i = 0; i < categories.length; i++) {
      const code = `CAT-${String(i + 1).padStart(4, "0")}`;
      categories[i].categoryCode = code;
      await categories[i].save();
    }

    res.status(200).json({ message: "Codes assigned successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isDelete: false })
      .populate("subcategories", "name")
      .sort({ createdAt: -1 })
      .lean();

    // Get product counts
    const productCounts = await Product.aggregate([
      { $match: { isDelete: false } }, // Only active products
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    productCounts.forEach((p) => {
      if (p._id) countMap[p._id.toString()] = p.count;
    });

    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      count: countMap[cat._id.toString()] || 0,
    }));

    res.status(200).json(categoriesWithCount);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found." });
    res.status(200).json(category);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { categoryName, categorySlug } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { categoryName, categorySlug },
      { new: true }
    );
    if (!category)
      return res.status(404).json({ message: "Category not found." });

    res.status(200).json({ message: "Category updated", category });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the category
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    // Optional: prevent marking as deleted if already deleted
    if (category.isDelete === true) {
      return res.status(400).json({ message: "Category is already deleted." });
    }

    // Soft delete: mark as deleted
    category.isDelete = true;
    await category.save();

    res.status(200).json({ message: "Category deleted successfully." });
  } catch (err) {
    console.error(err); // good for debugging
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.bulkDeleteCategories = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res
        .status(400)
        .json({ message: "Invalid or missing 'ids' array in request body." });
    }

    await Category.deleteMany({ _id: { $in: ids } });

    res.status(200).json({ message: "Categories deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Bulk delete failed", error: error.message });
  }
};

exports.deleteSubCategory = async (req, res) => {
  try {
    const subCategoryId = req.params.id;

    // 1️⃣ Find subcategory and check if it exists and not already deleted
    const subcategory = await Subcategory.findOne({
      _id: subCategoryId,
      isDeleted: false, // Optional: only allow deleting non-deleted ones
    });

    if (!subcategory) {
      return res.status(404).json({
        message: "Subcategory not found or already deleted"
      });
    }

    // 2️⃣ Soft delete: set isDeleted to true
    await Subcategory.findByIdAndUpdate(
      subCategoryId,
      { isDeleted: true },
      { new: true }
    );

    // 3️⃣ Remove subcategory ID from parent's subcategories array
    await Category.findByIdAndUpdate(
      subcategory.category,
      { $pull: { subcategories: subCategoryId } },
      { new: true }
    );

    res.status(200).json({
      message: "Subcategory deleted successfully (soft delete)"
    });

  } catch (error) {
    console.error("🔥 SOFT DELETE SUBCATEGORY ERROR:", error);
    res.status(500).json({
      message: "Failed to delete subcategory",
      error: error.message,
    });
  }
};


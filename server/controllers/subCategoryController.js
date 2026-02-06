// controllers/subCategoryController.js
const Category = require("../models/categoryModels");
const Subcategory = require("../models/subCateoryModal");

exports.addSubcategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Subcategory name is required" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // prevent duplicate in SAME category
    const exists = await Subcategory.findOne({
      name: name.trim(),
      category: categoryId,
    });

    if (exists) {
      return res.status(400).json({
        message: "Subcategory already exists in this category",
      });
    }

    const subcategory = await Subcategory.create({
      name: name.trim(),
      category: categoryId,
    });

    category.subcategories.push(subcategory._id);
    await category.save();

    res.status(201).json({
      message: "Subcategory added successfully",
      subcategory,
    });
  } catch (error) {
    console.error("🔥 ADD SUBCATEGORY ERROR:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getAllSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.find()
      .populate("category", "categoryName categoryCode")
      .sort({ createdAt: -1 });

    res.status(200).json(subcategories);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, categoryId } = req.body;

    const subcategory = await Subcategory.findById(id);
    if (!subcategory)
      return res.status(404).json({ message: "Subcategory not found" });

    // update name
    if (name) subcategory.name = name.trim();

    // update category only if categoryId is provided and different
    if (categoryId && subcategory.category.toString() !== categoryId) {
      const oldCategory = await Category.findById(subcategory.category);
      oldCategory?.subcategories.pull(subcategory._id);
      await oldCategory?.save();

      const newCategory = await Category.findById(categoryId);
      if (!newCategory)
        return res.status(404).json({ message: "Category not found" });

      newCategory.subcategories.push(subcategory._id);
      await newCategory.save();

      subcategory.category = categoryId;
    }

    await subcategory.save();

    res.status(200).json({
      message: "Subcategory updated successfully",
      subcategory,
    });
  } catch (error) {
    console.error("🔥 UPDATE SUBCATEGORY ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the subcategory
    const subcategory = await Subcategory.findById(id);
    if (!subcategory) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    // Optional: prevent double-deletion
    if (subcategory.isDelete === true) {
      return res.status(400).json({ message: "Subcategory already deleted" });
    }

    // Soft delete: set isDelete to true
    subcategory.isDelete = true;
    await subcategory.save();

    // Remove the reference from the parent Category's subcategories array
    await Category.findByIdAndUpdate(
      subcategory.category,
      { $pull: { subcategories: subcategory._id } },
      { new: true }
    );

    res.status(200).json({ message: "Subcategory deleted successfully" });
  } catch (error) {
    console.error(error); // optional: log for debugging
    res.status(500).json({ message: "Server error" });
  }
};

exports.getSubcategoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const subcategories = await Subcategory.find({
      category: categoryId,
      isDelete: { $ne: true }  // Exclude soft-deleted
    }).sort({ createdAt: -1 });

    res.status(200).json(subcategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch subcategories" });
  }
};

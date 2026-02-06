const express = require("express");
const router = express.Router();

const {
  addSubcategory,
  getAllSubcategories,
  deleteSubcategory,
  updateSubcategory,
  getSubcategoriesByCategory,
} = require("../controllers/subCategoryController");

const { verifyToken } = require("../middleware/Authentication/verifyToken");
const { authMiddleware } = require("../middleware/auth");
const { checkPermission } = require("../middleware/permission/checkPermission");

// ADD subcategory (with categoryId)
router.post(
  "/categories/:categoryId/subcategories",
  verifyToken,
  checkPermission("Subcategory", "write"),
  authMiddleware,
  addSubcategory
);

// GET all subcategories
router.get(
  "/",
  verifyToken,
  checkPermission("Subcategory", "read"),
  authMiddleware,
  getAllSubcategories
);

// UPDATE subcategory
router.put(
  "/:id",
  verifyToken,
  checkPermission("Subcategory", "update"),
  authMiddleware,
  updateSubcategory
);

// DELETE subcategory
router.delete(
  "/:id",
  verifyToken,
  checkPermission("Subcategory", "delete"),
  authMiddleware,
  deleteSubcategory
);

// GET subcategories by category
router.get(
  "/by-category/:categoryId",
  authMiddleware,
  getSubcategoriesByCategory
);

module.exports = router;

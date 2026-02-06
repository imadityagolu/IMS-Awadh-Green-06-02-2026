const DamageReturn = require("../models/damageReturnModel");
const Product = require("../models/productModels");

exports.createDamage = async (req, res) => {
  try {
    const { category, product, quantity, remarks } = req.body;
    if (!category || !product) {
      return res.status(400).json({ message: "Category and product are required" });
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive number" });
    }

    const prod = await Product.findById(product).lean();
    if (!prod) return res.status(404).json({ message: "Product not found" });

    // Optional: ensure category matches product's category
    if (String(prod.category) !== String(category)) {
      return res.status(400).json({ message: "Selected product does not belong to selected category" });
    }

    const max = Number(prod.stockQuantity) || 0;
    if (qty > max) {
      return res.status(400).json({ message: `Quantity cannot exceed opening quantity (${max})` });
    }

    const doc = await DamageReturn.create({
      category,
      product,
      quantity: qty,
      remarks: remarks || "",
      createdBy: req.user?._id,
    });

    const newOpening = Math.max(0, max - qty);
    let updateFields = { stockQuantity: newOpening };
    if (typeof prod.quantity === "number") {
      const newQtyField = Math.max(0, Number(prod.quantity) - qty);
      updateFields.quantity = newQtyField;
    }
    await Product.findByIdAndUpdate(product, { $set: updateFields }, { new: true });

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDamages = async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const { category, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const matchStage = {
      $or: [{ isDelete: false }, { isDelete: { $exists: false } }]
    };
    if (category) {
      try {
        matchStage.category = new mongoose.Types.ObjectId(category);
      } catch (e) { /* ignore invalid id */ }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    ];

    if (search && search.trim()) {
      pipeline.push({
        $match: {
          "product.productName": { $regex: search.trim(), $options: "i" },
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      }
    );

    const result = await DamageReturn.aggregate(pipeline);
    const items = (result[0]?.items || []).map((doc) => ({
      _id: doc._id,
      product: {
        _id: doc.product._id,
        productName: doc.product.productName,
        unit: doc.product.unit || "",
        stockQuantity: doc.product.stockQuantity,
        images: doc.product.images,
      },
      category: {
        _id: doc.category._id,
        categoryName: doc.category.categoryName,
      },
      quantity: doc.quantity,
      remarks: doc.remarks || "",
      createdAt: doc.createdAt,
    }));
    const total = result[0]?.totalCount?.[0]?.count || 0;
    res.status(200).json({ items, total, page, limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteDamage = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await DamageReturn.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Damage report not found" });
    }
    if (doc.isDelete) {
      return res.status(200).json({ message: "Damage report already deleted", damage: doc });
    }
    const qty = Math.max(0, Number(doc.quantity) || 0);
    if (qty > 0 && doc.product) {
      await Product.findByIdAndUpdate(doc.product, { $inc: { stockQuantity: qty } });
    }
    doc.isDelete = true;
    await doc.save();
    res.status(200).json({ message: "Damage report deleted and stock restored", damage: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDamage = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, remarks } = req.body;
    
    const damage = await DamageReturn.findById(id);
    if (!damage) {
      return res.status(404).json({ message: "Damage report not found" });
    }

    const newQty = Number(quantity);
    if (!Number.isFinite(newQty) || newQty < 0) {
      return res.status(400).json({ message: "Quantity must be a non-negative number" });
    }

    const oldQty = Number(damage.quantity) || 0;
    const diff = newQty - oldQty;

    if (diff !== 0) {
      const product = await Product.findById(damage.product);
      if (!product) {
        return res.status(404).json({ message: "Associated product not found" });
      }

      if (diff > 0 && product.stockQuantity < diff) {
        return res.status(400).json({ 
          message: `Insufficient stock to increase damage quantity. Available: ${product.stockQuantity}` 
        });
      }

      const newOpening = Math.max(0, Number(product.stockQuantity) - diff);
      
      let updateFields = { stockQuantity: newOpening };
      if (typeof product.quantity === "number") {
          const newQtyField = Math.max(0, Number(product.quantity) - diff);
          updateFields.quantity = newQtyField;
      }
      
      await Product.findByIdAndUpdate(damage.product, { $set: updateFields });
    }

    damage.quantity = newQty;
    if (remarks !== undefined) damage.remarks = remarks;
    
    await damage.save();

    res.status(200).json(damage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

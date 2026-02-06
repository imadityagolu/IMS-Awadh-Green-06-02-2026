const Bag = require("../models/Bag");

// Add a new bag
exports.addBag = async (req, res) => {
  try {
    const { name, price } = req.body;
    let image = req.body.image;

    if (req.file) {
      image = req.file.path;
    }

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    const newBag = new Bag({
      name,
      price,
      image,
    });

    await newBag.save();

    res.status(201).json({ message: "Bag added successfully", data: newBag });
  } catch (error) {
    console.error("Error adding bag:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete bags
exports.deleteBags = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No bag IDs provided" });
    }

    await Bag.deleteMany({ _id: { $in: ids } });

    res.status(200).json({ message: "Bags deleted successfully" });
  } catch (error) {
    console.error("Error deleting bags:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all bags
exports.getBags = async (req, res) => {
  try {
    const bags = await Bag.find().sort({ createdAt: -1 });
    res.status(200).json({ data: bags });
  } catch (error) {
    console.error("Error fetching bags:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

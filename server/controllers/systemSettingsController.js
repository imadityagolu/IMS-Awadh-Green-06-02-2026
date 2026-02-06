const SystemSettings = require("../models/systemSettingsModels.js");

// Get System Settings
exports.getSystemSettings = async (req, res) => {
    try {
        const settings = await SystemSettings.findOne();
        if (!settings) {
            // Return default structure if no settings found
            return res.status(200).json({
                success: true,
                data: {
                    brand: false,
                    description: false,
                    category: false,
                    subcategory: false,
                    itembarcode: false,
                    hsn: false,
                    lotno: false,
                    supplier: false,
                    status: false,
                    serialno: false,
                    variants: { size: false, color: false },
                    units: false,
                    expiry: false,
                }
            });
        }
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        // console.error("Error fetching system settings:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Create or Update System Settings
exports.createSystemSettings = async (req, res) => {
    try {
        const {
            brand, description, category, subcategory, itembarcode, hsn,
            lotno, serialno, variants, units, expiry, supplier, status
        } = req.body;

        let settings = await SystemSettings.findOne();

        if (settings) {
            // Update existing settings
            if (typeof brand === 'boolean') settings.brand = brand;
            if (typeof description === 'boolean') settings.description = description;
            if (typeof category === 'boolean') settings.category = category;
            if (typeof subcategory === 'boolean') settings.subcategory = subcategory;
            if (typeof itembarcode === 'boolean') settings.itembarcode = itembarcode;
            if (typeof hsn === 'boolean') settings.hsn = hsn;
            if (typeof lotno === 'boolean') settings.lotno = lotno;
            if (typeof supplier === 'boolean') settings.supplier = supplier;
            if (typeof serialno === 'boolean') settings.serialno = serialno;
            if (typeof status === 'boolean') settings.status = status;
            if (variants) settings.variants = variants;
            if (typeof units === 'boolean') settings.units = units;
            if (typeof expiry === 'boolean') settings.expiry = expiry;

            await settings.save();
        } else {
            // Create new settings
            settings = await SystemSettings.create({
                brand: brand || false,
                description: description || false,
                category: category || false,
                subcategory: subcategory || false,
                itembarcode: itembarcode || false,
                hsn: hsn || false,
                lotno: lotno || false,
                supplier: supplier || false,
                status: status || false,
                serialno: serialno || false,
                variants: variants || { size: false, color: false },
                units: units || false,
                expiry: expiry || false
            });
        }

        res.status(200).json({
            success: true,
            message: "System settings updated successfully",
            data: settings
        });
    } catch (error) {
        // console.error("Error updating system settings:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

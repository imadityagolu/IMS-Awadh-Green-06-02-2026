// controllers/roleController.js
const Role = require("../models/roleModels");
const Users = require("../models/usersModels");

// Create role with only modulePermissions
exports.createRole = async (req, res) => {
  try {
    const { roleName, status, modulePermissions = {} } = req.body;

    // Validate required fields
    if (!roleName) {
      return res.status(400).json({ message: "Role name is required" });
    }

    // Check for existing role
    const existingRole = await Role.findOne({ roleName });
    if (existingRole) {
      return res.status(400).json({ message: "Role already exists" });
    }

    // Ensure modulePermissions have the correct structure with 'all' field
    const enhancedPermissions = {};
    Object.keys(modulePermissions).forEach(module => {
      const perms = modulePermissions[module];
      enhancedPermissions[module] = {
        create: perms.create || false,
        read: perms.read || false,
        update: perms.update || false,
        delete: perms.delete || false,
        all: (perms.create && perms.read && perms.update && perms.delete) || perms.all || false
      };
    });

    const newRole = new Role({
      roleName,
      status: status || "Active",
      modulePermissions: enhancedPermissions
    });

    await newRole.save();

    res.status(201).json({
      message: "Role created successfully",
      role: newRole,
    });
  } catch (error) {
    console.error("Create role error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all roles with member count
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .sort({ createdAt: -1 })
      .populate("memberCount", "count");

    // Format response with member count
    const formattedRoles = roles.map((role) => ({
      _id: role._id,
      roleName: role.roleName,
      status: role.status,
      modulePermissions: role.modulePermissions,
      memberCount: role.memberCount || 0,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));

    res.status(200).json(formattedRoles);
  } catch (error) {
    console.error("Get all roles error:", error);
    res.status(500).json({
      message: "Error fetching roles",
      error: error.message,
    });
  }
};

// Get role by ID with member count
exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Add validation for invalid IDs
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({
        message: "Invalid role ID provided",
      });
    }

    // Optional: Add MongoDB ObjectId validation
    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid role ID format",
      });
    }

    const role = await Role.findById(id).populate("memberCount", "count");

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    const formattedRole = {
      _id: role._id,
      roleName: role.roleName,
      status: role.status,
      modulePermissions: role.modulePermissions,
      memberCount: role.memberCount || 0,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };

    res.status(200).json(formattedRole);
  } catch (error) {
    console.error("Error fetching role by ID:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get only active roles (for dropdowns)
exports.getActiveRoles = async (req, res) => {
  try {
    const activeRoles = await Role.find({ status: "Active" })
      .sort({ createdAt: -1 })
      .populate("memberCount", "count");

    // Format for react-select
    const formattedRoles = activeRoles.map((role) => ({
      label: role.roleName,
      value: role._id,
      memberCount: role.memberCount || 0,
      // Include all permissions if needed for frontend
      permissions: role.modulePermissions
    }));

    res.status(200).json(formattedRoles);
  } catch (error) {
    console.error("Get active roles error:", error);
    res.status(500).json({
      message: "Error fetching active roles",
      error: error.message,
    });
  }
};

// Update role
exports.updateRole = async (req, res) => {
  try {
    const { roleName, status, modulePermissions } = req.body;

    // Ensure modulePermissions have the correct structure with 'all' field
    const enhancedPermissions = {};
    if (modulePermissions) {
      Object.keys(modulePermissions).forEach(module => {
        const perms = modulePermissions[module];
        enhancedPermissions[module] = {
          create: perms.create || false,
          read: perms.read || false,
          update: perms.update || false,
          delete: perms.delete || false,
          all: (perms.create && perms.read && perms.update && perms.delete) || perms.all || false
        };
      });
    }

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      {
        roleName,
        status,
        modulePermissions: enhancedPermissions
      },
      { new: true, runValidators: true }
    );

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({
      message: "Role updated successfully",
      role,
    });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete role (with check for assigned users)
exports.deleteRole = async (req, res) => {
  try {
    const roleId = req.params.id;

    // Check if any users are assigned to this role
    const userCount = await Users.countDocuments({ role: roleId });

    if (userCount > 0) {
      return res.status(400).json({
        message: `Cannot delete role. ${userCount} user(s) are assigned to this role.`,
      });
    }

    const role = await Role.findByIdAndDelete(roleId);

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({
      message: "Role deleted successfully",
      deletedRole: role,
    });
  } catch (error) {
    console.error("Delete role error:", error);
    res.status(500).json({
      message: "Error deleting role",
      error: error.message,
    });
  }
};

// Get role member count
exports.getRoleMemberCount = async (req, res) => {
  try {
    const roleId = req.params.id;
    const count = await Users.countDocuments({ role: roleId });

    res.status(200).json({ count });
  } catch (error) {
    console.error("Get role member count error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update role status
exports.updateRoleStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const role = await Role.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.status(200).json({
      message: "Role status updated successfully",
      role,
    });
  } catch (error) {
    console.error("Update role status error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Duplicate role
exports.duplicateRole = async (req, res) => {
  try {
    const roleId = req.params.id;
    const { newRoleName } = req.body;

    if (!newRoleName) {
      return res.status(400).json({ message: "New role name is required" });
    }

    // Check if new role name already exists
    const existingRole = await Role.findOne({ roleName: newRoleName });
    if (existingRole) {
      return res.status(400).json({ message: "Role name already exists" });
    }

    // Get original role
    const originalRole = await Role.findById(roleId);
    if (!originalRole) {
      return res.status(404).json({ message: "Original role not found" });
    }

    // Create duplicate with new name
    const duplicateRole = new Role({
      roleName: newRoleName,
      status: originalRole.status,
      modulePermissions: originalRole.modulePermissions,
    });

    await duplicateRole.save();

    res.status(201).json({
      message: "Role duplicated successfully",
      role: duplicateRole,
    });
  } catch (error) {
    console.error("Duplicate role error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// POST /api/roles/assign-permissions
exports.assignPermissions = async (req, res) => {
  const { roleId, permissions } = req.body;
  try {
    const role = await Role.findById(roleId);
    if (!role) return res.status(404).json({ message: "Role not found" });

    // Ensure permissions have the correct structure with 'all' field
    const enhancedPermissions = {};
    Object.keys(permissions).forEach(module => {
      const perms = permissions[module];
      enhancedPermissions[module] = {
        create: perms.create || false,
        read: perms.read || false,
        update: perms.update || false,
        delete: perms.delete || false,
        all: (perms.create && perms.read && perms.update && perms.delete) || perms.all || false
      };
    });

    role.modulePermissions = enhancedPermissions;
    await role.save();

    res.status(200).json({ 
      message: "Permissions updated successfully", 
      role 
    });
  } catch (err) {
    console.error("Assign permissions error:", err);
    res.status(500).json({ 
      message: "Server error", 
      error: err.message 
    });
  }
};
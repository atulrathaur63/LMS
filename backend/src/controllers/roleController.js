const Role = require("../models/Role");

const createRole = async (req, res) => {
  try {
    const { roleName, roleCode, description, permissions, status } = req.body || {};

    if (!roleName || !roleCode) {
      return res.status(400).json({
        success: false,
        message: "Role name and role code are required",
      });
    }

    const existingRole = await Role.findOne({
      $or: [
        { roleName: roleName.trim() },
        { roleCode: roleCode.trim().toUpperCase() },
      ],
    });

    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: "Role already exists",
      });
    }

    const role = await Role.create({
      roleName: roleName.trim(),
      roleCode: roleCode.trim().toUpperCase(),
      description: description || "",
      permissions: Array.isArray(permissions) ? permissions : [],
      status: status || "ACTIVE",
    });

    return res.status(201).json({
      success: true,
      message: "Role created successfully",
      role,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create role",
      error: error.message,
    });
  }
};

const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: roles.length,
      roles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch roles",
      error: error.message,
    });
  }
};

const getSingleRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    return res.status(200).json({
      success: true,
      role,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch role",
      error: error.message,
    });
  }
};

module.exports = {
  createRole,
  getAllRoles,
  getSingleRole,
};
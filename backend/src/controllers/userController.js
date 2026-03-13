const User = require("../models/User");
const Role = require("../models/Role");
const Department = require("../models/Department");

const createUser = async (req, res) => {
  try {
    const {
      employeeCode,
      name,
      email,
      password,
      phone,
      roleId,
      departmentId,
      designation,
      approverId,
      reportingManagerId,
      joiningDate,
      status,
    } = req.body || {};

    if (
      !employeeCode ||
      !name ||
      !email ||
      !password ||
      !roleId ||
      !departmentId ||
      !joiningDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingUserByEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const existingUserByEmployeeCode = await User.findOne({
      employeeCode: employeeCode.toUpperCase(),
    });
    if (existingUserByEmployeeCode) {
      return res.status(409).json({
        success: false,
        message: "Employee code already exists",
      });
    }

    const roleExists = await Role.findById(roleId);
    if (!roleExists) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    const departmentExists = await Department.findById(departmentId);
    if (!departmentExists) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    if (approverId) {
      const approverExists = await User.findById(approverId);
      if (!approverExists) {
        return res.status(404).json({
          success: false,
          message: "Approver not found",
        });
      }
    }

    if (reportingManagerId) {
      const managerExists = await User.findById(reportingManagerId);
      if (!managerExists) {
        return res.status(404).json({
          success: false,
          message: "Reporting manager not found",
        });
      }
    }

    const newUser = await User.create({
      employeeCode: employeeCode.toUpperCase(),
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      phone: phone || "",
      roleId,
      departmentId,
      designation: designation || "",
      approverId: approverId || null,
      reportingManagerId: reportingManagerId || null,
      joiningDate,
      status: status || "ACTIVE",
    });

    const createdUser = await User.findById(newUser._id)
      .select("-passwordHash")
      .populate("roleId", "roleName roleCode permissions status")
      .populate("departmentId", "departmentName departmentCode status")
      .populate("approverId", "name email employeeCode")
      .populate("reportingManagerId", "name email employeeCode");

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user: createdUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-passwordHash")
      .populate("roleId", "roleName roleCode permissions status")
      .populate("departmentId", "departmentName departmentCode status")
      .populate("approverId", "name email employeeCode")
      .populate("reportingManagerId", "name email employeeCode")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

const getSingleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-passwordHash")
      .populate("roleId", "roleName roleCode permissions status")
      .populate("departmentId", "departmentName departmentCode status")
      .populate("approverId", "name email employeeCode")
      .populate("reportingManagerId", "name email employeeCode");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const {
      name,
      phone,
      roleId,
      departmentId,
      designation,
      approverId,
      reportingManagerId,
      joiningDate,
      status,
    } = req.body || {};

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (approverId && approverId === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "User cannot be own approver",
      });
    }

    if (reportingManagerId && reportingManagerId === req.params.id) {
      return res.status(400).json({
        success: false,
        message: "User cannot be own reporting manager",
      });
    }

    if (roleId) {
      const roleExists = await Role.findById(roleId);
      if (!roleExists) {
        return res.status(404).json({
          success: false,
          message: "Role not found",
        });
      }
      user.roleId = roleId;
    }

    if (departmentId) {
      const departmentExists = await Department.findById(departmentId);
      if (!departmentExists) {
        return res.status(404).json({
          success: false,
          message: "Department not found",
        });
      }
      user.departmentId = departmentId;
    }

    if (approverId) {
      const approverExists = await User.findById(approverId);
      if (!approverExists) {
        return res.status(404).json({
          success: false,
          message: "Approver not found",
        });
      }
      user.approverId = approverId;
    } else if (approverId === null) {
      user.approverId = null;
    }

    if (reportingManagerId) {
      const managerExists = await User.findById(reportingManagerId);
      if (!managerExists) {
        return res.status(404).json({
          success: false,
          message: "Reporting manager not found",
        });
      }
      user.reportingManagerId = reportingManagerId;
    } else if (reportingManagerId === null) {
      user.reportingManagerId = null;
    }

    user.name = name ?? user.name;
    user.phone = phone ?? user.phone;
    user.designation = designation ?? user.designation;
    user.joiningDate = joiningDate ?? user.joiningDate;
    user.status = status ?? user.status;

    await user.save();

    const updatedUser = await User.findById(user._id)
      .select("-passwordHash")
      .populate("roleId", "roleName roleCode permissions status")
      .populate("departmentId", "departmentName departmentCode status")
      .populate("approverId", "name email employeeCode")
      .populate("reportingManagerId", "name email employeeCode");

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
};
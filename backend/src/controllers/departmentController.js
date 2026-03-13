const Department = require("../models/Department");
const User = require("../models/User");

const createDepartment = async (req, res) => {
  try {
    const { departmentName, departmentCode, description, status } = req.body || {};

    if (!departmentName) {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const query = [{ departmentName: departmentName.trim() }];

    if (departmentCode) {
      query.push({ departmentCode: departmentCode.trim().toUpperCase() });
    }

    const existingDepartment = await Department.findOne({ $or: query });

    if (existingDepartment) {
      return res.status(409).json({
        success: false,
        message: "Department already exists",
      });
    }

    const department = await Department.create({
      departmentName: departmentName.trim(),
      departmentCode: departmentCode ? departmentCode.trim().toUpperCase() : undefined,
      description: description || "",
      status: status || "ACTIVE",
    });

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create department",
      error: error.message,
    });
  }
};

const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
      error: error.message,
    });
  }
};

const getSingleDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    return res.status(200).json({
      success: true,
      department,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch department",
      error: error.message,
    });
  }
};

// update Department
const updateDepartment = async (req, res) => {
  try {
    const { departmentName, description } = req.body || {};

    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    if (departmentName !== undefined) department.departmentName = departmentName;
    if (description !== undefined) department.description = description;

    await department.save();

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      department,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update department",
      error: error.message,
    });
  }
};

// Delete Department
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const usersUsingDepartment = await User.countDocuments({
      departmentId: department._id,
    });

    if (usersUsingDepartment > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete department because users are assigned to it",
      });
    }

    await department.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete department",
      error: error.message,
    });
  }
};



module.exports = {
  createDepartment,
  getAllDepartments,
  getSingleDepartment,
  updateDepartment,
  deleteDepartment,
};

const LeaveType = require("../models/LeaveType");

const createLeaveType = async (req, res) => {
  try {
    const {
      leaveName,
      leaveCode,
      totalPerYear,
      isPaid,
      carryForward,
      requiresAttachment,
      allowHalfDay,
      status,
    } = req.body || {};

    if (!leaveName || !leaveCode || totalPerYear === undefined) {
      return res.status(400).json({
        success: false,
        message: "Leave name, leave code and total per year are required",
      });
    }

    const existingLeaveType = await LeaveType.findOne({
      $or: [
        { leaveName: leaveName.trim() },
        { leaveCode: leaveCode.trim().toUpperCase() },
      ],
    });

    if (existingLeaveType) {
      return res.status(409).json({
        success: false,
        message: "Leave type already exists",
      });
    }

    const leaveType = await LeaveType.create({
      leaveName: leaveName.trim(),
      leaveCode: leaveCode.trim().toUpperCase(),
      totalPerYear: Number(totalPerYear),
      isPaid: isPaid ?? true,
      carryForward: carryForward ?? false,
      requiresAttachment: requiresAttachment ?? false,
      allowHalfDay: allowHalfDay ?? false,
      status: status || "ACTIVE",
    });

    return res.status(201).json({
      success: true,
      message: "Leave type created successfully",
      leaveType,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create leave type",
      error: error.message,
    });
  }
};

const getAllLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leaveTypes.length,
      leaveTypes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leave types",
      error: error.message,
    });
  }
};

const getSingleLeaveType = async (req, res) => {
  try {
    const leaveType = await LeaveType.findById(req.params.id);

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
    }

    return res.status(200).json({
      success: true,
      leaveType,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leave type",
      error: error.message,
    });
  }
};

module.exports = {
  createLeaveType,
  getAllLeaveTypes,
  getSingleLeaveType,
};
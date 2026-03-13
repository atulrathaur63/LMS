const LeaveType = require("../models/LeaveType");
const LeaveBalance = require("../models/LeaveBalance");
const LeaveRequest = require("../models/LeaveRequest");

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

const updateLeaveType = async (req, res) => {
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

    const leaveType = await LeaveType.findById(req.params.id);

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
    }

    if (leaveName !== undefined) leaveType.leaveName = leaveName;
    if (leaveCode !== undefined) leaveType.leaveCode = String(leaveCode).toUpperCase();
    if (totalPerYear !== undefined) leaveType.totalPerYear = Number(totalPerYear);
    if (isPaid !== undefined) leaveType.isPaid = isPaid;
    if (carryForward !== undefined) leaveType.carryForward = carryForward;
    if (requiresAttachment !== undefined) leaveType.requiresAttachment = requiresAttachment;
    if (allowHalfDay !== undefined) leaveType.allowHalfDay = allowHalfDay;
    if (status !== undefined) leaveType.status = status;

    await leaveType.save();

    return res.status(200).json({
      success: true,
      message: "Leave type updated successfully",
      leaveType,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update leave type",
      error: error.message,
    });
  }
};

const updateLeaveTypeStatus = async (req, res) => {
  try {

    const { status } = req.body || {};

    if (!status || !["ACTIVE","INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status required: ACTIVE or INACTIVE",
      });
    }

    const leaveType = await LeaveType.findById(req.params.id);

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
    }

    leaveType.status = status;

    await leaveType.save();

    return res.status(200).json({
      success: true,
      message: "Leave type status updated successfully",
      leaveType,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Failed to update leave type status",
      error: error.message,
    });

  }
};

const deleteLeaveType = async (req, res) => {

  try {

    const leaveType = await LeaveType.findById(req.params.id);

    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
    }

    const balancesUsingType = await LeaveBalance.countDocuments({
      leaveTypeId: leaveType._id,
    });

    const requestsUsingType = await LeaveRequest.countDocuments({
      leaveTypeId: leaveType._id,
    });

    if (balancesUsingType > 0 || requestsUsingType > 0) {

      return res.status(400).json({
        success: false,
        message: "Cannot delete leave type because it is already used",
      });

    }

    await leaveType.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Leave type deleted successfully",
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Failed to delete leave type",
      error: error.message,
    });

  }

};

module.exports = {
  createLeaveType,
  getAllLeaveTypes,
  getSingleLeaveType,
  updateLeaveType,
  updateLeaveTypeStatus,
  deleteLeaveType,
};
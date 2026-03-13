const LeaveBalance = require("../models/LeaveBalance");
const User = require("../models/User");
const LeaveType = require("../models/LeaveType");

const createLeaveBalance = async (req, res) => {
  try {
    const { userId, leaveTypeId, year, allocated, used } = req.body || {};

    if (!userId || !leaveTypeId || !year || allocated === undefined) {
      return res.status(400).json({
        success: false,
        message: "userId, leaveTypeId, year and allocated are required",
      });
    }

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const leaveTypeExists = await LeaveType.findById(leaveTypeId);
    if (!leaveTypeExists) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
    }

    const existingBalance = await LeaveBalance.findOne({
      userId,
      leaveTypeId,
      year,
    });

    if (existingBalance) {
      return res.status(409).json({
        success: false,
        message: "Leave balance already exists for this user, leave type and year",
      });
    }

    const usedDays = Number(used || 0);
    const allocatedDays = Number(allocated);
    const remainingDays = allocatedDays - usedDays;

    if (remainingDays < 0) {
      return res.status(400).json({
        success: false,
        message: "Used days cannot be greater than allocated days",
      });
    }

    const leaveBalance = await LeaveBalance.create({
      userId,
      leaveTypeId,
      year: Number(year),
      allocated: allocatedDays,
      used: usedDays,
      remaining: remainingDays,
    });

    const populatedBalance = await LeaveBalance.findById(leaveBalance._id)
      .populate("userId", "employeeCode name email")
      .populate("leaveTypeId", "leaveName leaveCode totalPerYear");

    return res.status(201).json({
      success: true,
      message: "Leave balance created successfully",
      leaveBalance: populatedBalance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create leave balance",
      error: error.message,
    });
  }
};

const getAllLeaveBalances = async (req, res) => {
  try {
    const leaveBalances = await LeaveBalance.find()
      .populate("userId", "employeeCode name email")
      .populate("leaveTypeId", "leaveName leaveCode totalPerYear")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leaveBalances.length,
      leaveBalances,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leave balances",
      error: error.message,
    });
  }
};

const getUserLeaveBalances = async (req, res) => {
  try {
    const { userId } = req.params;
    const year = req.query.year;

    const query = { userId };
    if (year) {
      query.year = Number(year);
    }

    const leaveBalances = await LeaveBalance.find(query)
      .populate("userId", "employeeCode name email")
      .populate("leaveTypeId", "leaveName leaveCode totalPerYear")
      .sort({ year: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leaveBalances.length,
      leaveBalances,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user leave balances",
      error: error.message,
    });
  }
};

module.exports = {
  createLeaveBalance,
  getAllLeaveBalances,
  getUserLeaveBalances,
};
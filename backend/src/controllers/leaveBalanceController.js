const LeaveBalance = require("../models/LeaveBalance");
const User = require("../models/User");
const LeaveType = require("../models/LeaveType");
const { createNotification } = require("../services/notificationService");
const { createSystemLog } = require("../services/logService");

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

const getMyLeaveBalances = async (req, res) => {
  try {
    const userId = req.user.id;
    const year = req.query.year;

    const query = { userId };
    if (year) query.year = Number(year);

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
      message: "Failed to fetch my leave balances",
      error: error.message,
    });
  }
};

const updateLeaveBalance = async (req, res) => {
  try {
    const { allocated, used } = req.body || {};

    const leaveBalance = await LeaveBalance.findById(req.params.id);

    if (!leaveBalance) {
      return res.status(404).json({
        success: false,
        message: "Leave balance not found",
      });
    }

    const allocatedValue =
      allocated !== undefined ? Number(allocated) : leaveBalance.allocated;
    const usedValue =
      used !== undefined ? Number(used) : leaveBalance.used;

    if (allocatedValue < 0 || usedValue < 0) {
      return res.status(400).json({
        success: false,
        message: "Allocated and used values cannot be negative",
      });
    }

    if (usedValue > allocatedValue) {
      return res.status(400).json({
        success: false,
        message: "Used days cannot be greater than allocated days",
      });
    }

    leaveBalance.allocated = allocatedValue;
    leaveBalance.used = usedValue;
    leaveBalance.remaining = allocatedValue - usedValue;

    await leaveBalance.save();

    await createSystemLog({
      action: "LEAVE_BALANCE_UPDATED",
      entity: "LeaveBalance",
      entityId: leaveBalance._id,
      performedBy: req.user.id,
      details: {
        userId: leaveBalance.userId,
        leaveTypeId: leaveBalance.leaveTypeId,
        allocated: leaveBalance.allocated,
        used: leaveBalance.used,
        remaining: leaveBalance.remaining,
      },
    });

    const populatedBalance = await LeaveBalance.findById(leaveBalance._id)
      .populate("userId", "employeeCode name email")
      .populate("leaveTypeId", "leaveName leaveCode totalPerYear");

    return res.status(200).json({
      success: true,
      message: "Leave balance updated successfully",
      leaveBalance: populatedBalance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update leave balance",
      error: error.message,
    });
  }
};

const manualUpdateLeaveBalance = async (req, res) => {
  try {
    const { userId, leaveTypeId, year, action, days, remarks } = req.body || {};

    if (!userId || !leaveTypeId || !year || !action || days === undefined) {
      return res.status(400).json({
        success: false,
        message: "userId, leaveTypeId, year, action and days are required",
      });
    }

    if (!["ADD", "DEDUCT"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be ADD or DEDUCT",
      });
    }

    const numericDays = Number(days);

    if (numericDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "Days must be greater than 0",
      });
    }

    const leaveBalance = await LeaveBalance.findOne({
      userId,
      leaveTypeId,
      year: Number(year),
    });

    if (!leaveBalance) {
      return res.status(404).json({
        success: false,
        message: "Leave balance not found",
      });
    }

    if (action === "ADD") {
      leaveBalance.allocated += numericDays;
      leaveBalance.remaining += numericDays;
    }

    if (action === "DEDUCT") {
      if (leaveBalance.remaining < numericDays) {
        return res.status(400).json({
          success: false,
          message: "Insufficient remaining balance for deduction",
        });
      }

      leaveBalance.allocated -= numericDays;
      leaveBalance.remaining -= numericDays;

      if (leaveBalance.allocated < leaveBalance.used) {
        return res.status(400).json({
          success: false,
          message: "Allocated balance cannot be less than used balance",
        });
      }
    }

    await leaveBalance.save();

    await createSystemLog({
      action: "LEAVE_BALANCE_MANUAL_UPDATED",
      entity: "LeaveBalance",
      entityId: leaveBalance._id,
      performedBy: req.user.id,
      details: {
        userId,
        leaveTypeId,
        year,
        action,
        days: numericDays,
        remarks: remarks || "",
        allocated: leaveBalance.allocated,
        used: leaveBalance.used,
        remaining: leaveBalance.remaining,
      },
    });

    await createNotification({
      userId,
      title: "Leave Balance Updated",
      message: `Your leave balance has been manually ${action === "ADD" ? "increased" : "decreased"} by ${numericDays} day(s).`,
      type: "LEAVE_BALANCE_UPDATED",
      referenceId: leaveBalance._id,
      referenceModel: "LeaveBalance",
    });

    const populatedBalance = await LeaveBalance.findById(leaveBalance._id)
      .populate("userId", "employeeCode name email")
      .populate("leaveTypeId", "leaveName leaveCode totalPerYear");

    return res.status(200).json({
      success: true,
      message: "Leave balance manually updated successfully",
      leaveBalance: populatedBalance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to manually update leave balance",
      error: error.message,
    });
  }
};

module.exports = {
  createLeaveBalance,
  getAllLeaveBalances,
  getUserLeaveBalances,
  getMyLeaveBalances,
  updateLeaveBalance,
  manualUpdateLeaveBalance,
};
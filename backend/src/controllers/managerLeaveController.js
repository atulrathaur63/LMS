const LeaveRequest = require("../models/LeaveRequest");
const LeaveBalance = require("../models/LeaveBalance");
const { createNotification } = require("../services/notificationService");

const getTeamLeaves = async (req, res) => {
  try {
    const managerId = req.user.id;

    const leaves = await LeaveRequest.find({
      approverId: managerId,
      status: "PENDING",
    })
      .populate("userId", "employeeCode name email")
      .populate("leaveTypeId", "leaveName leaveCode")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch team leaves",
      error: error.message,
    });
  }
};

const managerAction = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { status, remarks } = req.body || {};

    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required: APPROVED or REJECTED",
      });
    }

    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (String(leave.approverId) !== String(managerId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to take action on this leave",
      });
    }

    if (leave.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Leave already processed",
      });
    }

    if (status === "APPROVED") {
      const year = new Date(leave.fromDate).getFullYear();

      const balance = await LeaveBalance.findOne({
        userId: leave.userId,
        leaveTypeId: leave.leaveTypeId,
        year,
      });

      if (!balance) {
        return res.status(404).json({
          success: false,
          message: "Leave balance not found",
        });
      }

      if (balance.remaining < leave.totalDays) {
        return res.status(400).json({
          success: false,
          message: "Insufficient leave balance for approval",
        });
      }

      balance.used += leave.totalDays;
      balance.remaining -= leave.totalDays;
      await balance.save();
    }

    leave.status = status;
    leave.remarks = remarks || "";
    leave.managerActionAt = new Date();

    await leave.save();

    if (status === "APPROVED") {
  await createNotification({
    userId: leave.userId,
    title: "Leave Approved",
    message: `Your leave request from ${leave.fromDate.toISOString().split("T")[0]} to ${leave.toDate.toISOString().split("T")[0]} has been approved.`,
    type: "LEAVE_APPROVED",
    referenceId: leave._id,
    referenceModel: "LeaveRequest",
  });
}

if (status === "REJECTED") {
  await createNotification({
    userId: leave.userId,
    title: "Leave Rejected",
    message: `Your leave request from ${leave.fromDate.toISOString().split("T")[0]} to ${leave.toDate.toISOString().split("T")[0]} has been rejected.`,
    type: "LEAVE_REJECTED",
    referenceId: leave._id,
    referenceModel: "LeaveRequest",
  });
}

    const updatedLeave = await LeaveRequest.findById(leave._id)
      .populate("userId", "employeeCode name email")
      .populate("leaveTypeId", "leaveName leaveCode")
      .populate("approverId", "employeeCode name email")
      .populate("reportingManagerId", "employeeCode name email");

    return res.status(200).json({
      success: true,
      message: `Leave ${status.toLowerCase()} successfully`,
      leave: updatedLeave,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Manager action failed",
      error: error.message,
    });
  }
};

module.exports = {
  getTeamLeaves,
  managerAction,
};
const LeaveRequest = require("../models/LeaveRequest");
const LeaveBalance = require("../models/LeaveBalance");
const { createNotification } = require("../services/notificationService");
const User = require("../models/User");
const { createApprovalLog, createSystemLog } = require("../services/logService");

const formatDate = (d) => new Date(d).toISOString().split("T")[0];

const getTeamLeaves = async (req, res) => {
  try {
    const managerId = req.user.id;

    const leaves = await LeaveRequest.find({
      approverId: managerId,
      status: { $in: ["PENDING", "CANCEL_PENDING"] },
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

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status required: APPROVED or REJECTED",
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
        message: "Not authorized",
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
          message: "Insufficient leave balance",
        });
      }

      balance.used += leave.totalDays;
      balance.remaining -= leave.totalDays;
      await balance.save();

      await createSystemLog({
        action: "LEAVE_BALANCE_UPDATED",
        entity: "LeaveBalance",
        entityId: balance._id,
        performedBy: managerId,
        details: {
          userId: leave.userId,
          leaveTypeId: leave.leaveTypeId,
          deductedDays: leave.totalDays,
          used: balance.used,
          remaining: balance.remaining,
        },
      });
    }

    leave.status = status;
    leave.remarks = remarks || "";
    leave.approverComment = remarks || "";
    leave.managerActionAt = new Date();

    if (status === "APPROVED") leave.approvedAt = new Date();
    if (status === "REJECTED") leave.rejectedAt = new Date();

    await leave.save();

    await createApprovalLog({
      leaveRequestId: leave._id,
      actionBy: managerId,
      action: status,
      comment: remarks || "",
    });

    await createSystemLog({
      action: `LEAVE_${status}`,
      entity: "LeaveRequest",
      entityId: leave._id,
      performedBy: managerId,
    });

    const hrUsers = await User.find({ status: "ACTIVE" }).populate("roleId", "roleCode");

    const hrAdmins = hrUsers.filter(
      (u) => u.roleId && ["HR", "ADMIN", "SUPER_ADMIN"].includes(u.roleId.roleCode)
    );

    for (const hr of hrAdmins) {
      if (String(hr._id) === String(managerId)) continue;

      await createNotification({
        userId: hr._id,
        title: `Leave ${status}`,
        message: `A leave request has been ${status.toLowerCase()} by the approver.`,
        type: status === "APPROVED" ? "LEAVE_APPROVED" : "LEAVE_REJECTED",
        referenceId: leave._id,
        referenceModel: "LeaveRequest",
      });
    }

    if (hrAdmins.length > 0) leave.hrNotifiedAt = new Date();

    if (status === "APPROVED") {
      await createNotification({
        userId: leave.userId,
        title: "Leave Approved",
        message: `Your leave request from ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)} has been approved.`,
        type: "LEAVE_APPROVED",
        referenceId: leave._id,
        referenceModel: "LeaveRequest",
      });
    }

    if (status === "REJECTED") {
      await createNotification({
        userId: leave.userId,
        title: "Leave Rejected",
        message: `Your leave request from ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)} has been rejected.`,
        type: "LEAVE_REJECTED",
        referenceId: leave._id,
        referenceModel: "LeaveRequest",
      });
    }

    const updatedLeave = await LeaveRequest.findById(leave._id)
      .populate("userId", "employeeCode name email")
      .populate("leaveTypeId", "leaveName leaveCode")
      .populate("approverId", "employeeCode name email");

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

const cancelApprove = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { remarks } = req.body || {};

    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });

    if (String(leave.approverId) !== String(managerId))
      return res.status(403).json({ success: false, message: "Not authorized" });

    if (leave.status !== "CANCEL_PENDING")
      return res.status(400).json({ success: false, message: "Leave not pending cancellation" });

    const year = new Date(leave.fromDate).getFullYear();

    const balance = await LeaveBalance.findOne({
      userId: leave.userId,
      leaveTypeId: leave.leaveTypeId,
      year,
    });

    if (balance) {
      balance.used = Math.max(0, balance.used - leave.totalDays);
      balance.remaining += leave.totalDays;
      await balance.save();
    }

    leave.status = "CANCELLED";
    leave.cancelledAt = new Date();
    leave.managerActionAt = new Date();
    leave.approverComment = remarks || "";
    await leave.save();

    await createApprovalLog({
      leaveRequestId: leave._id,
      actionBy: managerId,
      action: "CANCEL_APPROVED",
      comment: remarks || "",
    });

    await createNotification({
      userId: leave.userId,
      title: "Leave Cancellation Approved",
      message: `Your leave cancellation request from ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)} has been approved.`,
      type: "LEAVE_CANCELLATION_APPROVED",
      referenceId: leave._id,
      referenceModel: "LeaveRequest",
    });

    return res.status(200).json({
      success: true,
      message: "Leave cancellation approved successfully",
      leave,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Leave cancellation approval failed",
      error: error.message,
    });
  }
};

const cancelReject = async (req, res) => {
  try {
    const managerId = req.user.id;
    const { remarks } = req.body || {};

    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });

    if (String(leave.approverId) !== String(managerId))
      return res.status(403).json({ success: false, message: "Not authorized" });

    if (leave.status !== "CANCEL_PENDING")
      return res.status(400).json({ success: false, message: "Leave not pending cancellation" });

    leave.status = "APPROVED";
    leave.managerActionAt = new Date();
    leave.approverComment = remarks || "";
    await leave.save();

    await createApprovalLog({
      leaveRequestId: leave._id,
      actionBy: managerId,
      action: "CANCEL_REJECTED",
      comment: remarks || "",
    });

    await createNotification({
      userId: leave.userId,
      title: "Leave Cancellation Rejected",
      message: `Your leave cancellation request from ${formatDate(leave.fromDate)} to ${formatDate(leave.toDate)} has been rejected.`,
      type: "LEAVE_CANCELLATION_REJECTED",
      referenceId: leave._id,
      referenceModel: "LeaveRequest",
    });

    return res.status(200).json({
      success: true,
      message: "Leave cancellation rejected successfully",
      leave,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Leave cancellation rejection failed",
      error: error.message,
    });
  }
};

module.exports = {
  getTeamLeaves,
  managerAction,
  cancelApprove,
  cancelReject,
};
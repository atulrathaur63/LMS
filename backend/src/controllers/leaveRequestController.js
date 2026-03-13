const LeaveRequest = require("../models/LeaveRequest");
const LeaveBalance = require("../models/LeaveBalance");
const LeaveType = require("../models/LeaveType");
const Holiday = require("../models/Holiday");
const User = require("../models/User");
const { createNotification } = require("../services/notificationService");
const { createApprovalLog, createSystemLog } = require("../services/logService");

const calculateWorkingDays = async (fromDate, toDate, leaveSession) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);

  if (start > end) return 0;

  if (leaveSession === "FIRST_HALF" || leaveSession === "SECOND_HALF") {
    return 0.5;
  }

  if (leaveSession === "SHORT_LEAVE") {
    return 0.5;
  }

  const holidays = await Holiday.find({
    holidayDate: {
      $gte: new Date(new Date(fromDate).setHours(0, 0, 0, 0)),
      $lte: new Date(new Date(toDate).setHours(23, 59, 59, 999)),
    },
    status: "ACTIVE",
  }).select("holidayDate");

  const holidaySet = new Set(
    holidays.map((h) => new Date(h.holidayDate).toISOString().split("T")[0])
  );

  let totalDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    const dateStr = current.toISOString().split("T")[0];

    const isSunday = day === 0;
    const isOddSat = isOddSaturday(current);
    const isHoliday = holidaySet.has(dateStr);

    if (!isSunday && !isOddSat && !isHoliday) {
  totalDays += 1;
}

    current.setDate(current.getDate() + 1);
  }

  return totalDays;
};

const applyLeave = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      leaveTypeId,
      fromDate,
      toDate,
      reason,
      leaveSession,
      attachment,
    } = req.body || {};

    if (!leaveTypeId || !fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "leaveTypeId, fromDate, toDate and reason are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Inactive user cannot apply leave",
      });
    }

    if (!user.approverId) {
      return res.status(400).json({
        success: false,
        message: "Approver is not assigned to this employee",
      });
    }

    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      });
    }

    if (leaveType.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Leave type is inactive",
      });
    }

    const sessionValue = leaveSession || "FULL_DAY";

    if (
      (sessionValue === "FIRST_HALF" || sessionValue === "SECOND_HALF") &&
      !leaveType.allowHalfDay
    ) {
      return res.status(400).json({
        success: false,
        message: "Half day is not allowed for this leave type",
      });
    }

    if (leaveType.requiresAttachment && !attachment) {
      return res.status(400).json({
        success: false,
        message: "Attachment is required for this leave type",
      });
    }

    // odd saturday off logic
    const isOddSaturday = (date) => {

  const day = date.getDay();

  if (day !== 6) return false;

  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);

  const saturdayCount =
    Math.ceil((date.getDate() + firstDay.getDay()) / 7);

  return [1,3,5].includes(saturdayCount);

};

    const totalDays = await calculateWorkingDays(fromDate, toDate, sessionValue);

    if (totalDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave date range",
      });
    }

    const overlapLeave = await LeaveRequest.findOne({
      userId,
      status: { $in: ["PENDING", "APPROVED"] },
      $or: [
        {
          fromDate: { $lte: new Date(toDate) },
          toDate: { $gte: new Date(fromDate) },
        },
      ],
    });

    if (overlapLeave) {
      return res.status(409).json({
        success: false,
        message: "Leave request overlaps with an existing leave",
      });
    }

    const year = new Date(fromDate).getFullYear();

    const leaveBalance = await LeaveBalance.findOne({
      userId,
      leaveTypeId,
      year,
    });

    if (!leaveBalance) {
      return res.status(404).json({
        success: false,
        message: "Leave balance not found for selected leave type and year",
      });
    }

    if (leaveBalance.remaining < totalDays) {
      return res.status(400).json({
        success: false,
        message: "Insufficient leave balance",
      });
    }

    const leaveRequest = await LeaveRequest.create({
      userId,
      leaveTypeId,
      approverId: user.approverId,
      reportingManagerId: user.reportingManagerId || null,
      fromDate,
      toDate,
      totalDays,
      reason,
      attachment: attachment || "",
      leaveSession: sessionValue,
      status: "PENDING",
    });

await createSystemLog({
  action: "LEAVE_SUBMITTED",
  entity: "LeaveRequest",
  entityId: leaveRequest._id,
  performedBy: userId,
  details: {
    approverId: user.approverId,
    fromDate,
    toDate,
    totalDays,
    leaveTypeId,
  },
});

    await createApprovalLog({
  leaveRequestId: leaveRequest._id,
  actionBy: userId,
  action: "SUBMITTED",
  comment: "Leave submitted by employee",
});

    await createNotification({
  userId: user.approverId,
  title: "New Leave Request",
  message: `${user.name} has applied for leave from ${fromDate} to ${toDate}.`,
  type: "LEAVE_APPLIED",
  referenceId: leaveRequest._id,
  referenceModel: "LeaveRequest",
});

    const populatedLeaveRequest = await LeaveRequest.findById(leaveRequest._id)
      .populate("userId", "employeeCode name email")
      .populate("leaveTypeId", "leaveName leaveCode")
      .populate("approverId", "employeeCode name email")
      .populate("reportingManagerId", "employeeCode name email");

    return res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      leaveRequest: populatedLeaveRequest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to apply leave",
      error: error.message,
    });
  }
};

const getMyLeaves = async (req, res) => {
  try {
    const userId = req.user.id;

    const leaves = await LeaveRequest.find({ userId })
      .populate("leaveTypeId", "leaveName leaveCode")
      .populate("approverId", "employeeCode name email")
      .populate("reportingManagerId", "employeeCode name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leave requests",
      error: error.message,
    });
  }
};

const getSingleLeave = async (req, res) => {
  try {
    const leave = await LeaveRequest.findById(req.params.id)
      .populate("userId", "employeeCode name email")
      .populate("leaveTypeId", "leaveName leaveCode")
      .populate("approverId", "employeeCode name email")
      .populate("reportingManagerId", "employeeCode name email");

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (
      req.user.roleCode === "EMPLOYEE" &&
      String(leave.userId._id) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      leave,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leave request",
      error: error.message,
    });
  }
};

const cancelMyLeave = async (req, res) => {
  try {
    const userId = req.user.id;

    const leave = await LeaveRequest.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (String(leave.userId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can cancel only your own leave",
      });
    }

    if (["REJECTED", "CANCELLED", "CANCEL_PENDING"].includes(leave.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${leave.status.toLowerCase()} leave`,
      });
    }

    // Pending leave = direct cancel
    if (leave.status === "PENDING") {
      leave.status = "CANCELLED";
      leave.remarks = "Pending leave cancelled by employee";
      leave.cancelledAt = new Date();
      await leave.save();

      await createApprovalLog({
        leaveRequestId: leave._id,
        actionBy: userId,
        action: "CANCELLED",
        comment: "Pending leave cancelled directly by employee",
      });

      await createSystemLog({
        action: "LEAVE_CANCELLED",
        entity: "LeaveRequest",
        entityId: leave._id,
        performedBy: userId,
        details: {
          mode: "DIRECT_PENDING_CANCEL",
        },
      });

      await createNotification({
        userId: leave.approverId,
        title: "Leave Cancelled",
        message: "An employee cancelled a pending leave request.",
        type: "LEAVE_CANCELLED",
        referenceId: leave._id,
        referenceModel: "LeaveRequest",
      });
    }

    // Approved leave = cancel request, not direct cancel
    if (leave.status === "APPROVED") {
      leave.status = "CANCEL_PENDING";
      leave.remarks = "Approved leave cancellation requested by employee";
      await leave.save();

      await createApprovalLog({
        leaveRequestId: leave._id,
        actionBy: userId,
        action: "CANCEL_REQUESTED",
        comment: "Approved leave cancellation requested by employee",
      });

      await createSystemLog({
        action: "LEAVE_CANCELLATION_REQUESTED",
        entity: "LeaveRequest",
        entityId: leave._id,
        performedBy: userId,
        details: {
          mode: "APPROVED_CANCEL_REQUEST",
        },
      });

      await createNotification({
        userId: leave.approverId,
        title: "Leave Cancellation Request",
        message: "An employee requested cancellation of an approved leave.",
        type: "LEAVE_CANCEL_REQUESTED",
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
      message:
        updatedLeave.status === "CANCELLED"
          ? "Leave cancelled successfully"
          : "Leave cancellation request submitted successfully",
      leave: updatedLeave,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to cancel leave",
      error: error.message,
    });
  }
};


module.exports = {
  applyLeave,
  getMyLeaves,
  getSingleLeave,
  cancelMyLeave,
};
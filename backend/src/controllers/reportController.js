const LeaveRequest = require("../models/LeaveRequest");
const LeaveBalance = require("../models/LeaveBalance");
const User = require("../models/User");

const getLeaveReport = async (req, res) => {
  try {
    const {
      status,
      userId,
      departmentId,
      leaveTypeId,
      fromDate,
      toDate,
      month,
      year,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (leaveTypeId) query.leaveTypeId = leaveTypeId;

    if (fromDate || toDate) {
      query.fromDate = {};
      if (fromDate) query.fromDate.$gte = new Date(fromDate);
      if (toDate) query.fromDate.$lte = new Date(toDate);
    }

    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
      query.fromDate = { $gte: start, $lte: end };
    }

    let userIds = null;

    if (departmentId) {
      const users = await User.find({ departmentId }).select("_id");
      userIds = users.map((u) => u._id);
      query.userId = { $in: userIds };
    }

    const leaves = await LeaveRequest.find(query)
      .populate("userId", "employeeCode name email designation departmentId")
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
      message: "Failed to fetch leave report",
      error: error.message,
    });
  }
};

const getEmployeeLeaveHistoryReport = async (req, res) => {
  try {
    const { userId } = req.params;

    const leaves = await LeaveRequest.find({ userId })
      .populate("userId", "employeeCode name email designation")
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
      message: "Failed to fetch employee leave history report",
      error: error.message,
    });
  }
};

const getDepartmentLeaveSummary = async (req, res) => {
  try {
    const summary = await LeaveRequest.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "departments",
          localField: "user.departmentId",
          foreignField: "_id",
          as: "department",
        },
      },
      { $unwind: "$department" },
      {
        $group: {
          _id: "$department._id",
          departmentName: { $first: "$department.departmentName" },
          totalRequests: { $sum: 1 },
          approvedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0] },
          },
          pendingRequests: {
            $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
          },
          rejectedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0] },
          },
          cancelledRequests: {
            $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
          },
          totalLeaveDays: { $sum: "$totalDays" },
        },
      },
      {
        $project: {
          _id: 1,
          departmentName: 1,
          totalRequests: 1,
          approvedRequests: 1,
          pendingRequests: 1,
          rejectedRequests: 1,
          cancelledRequests: 1,
          totalLeaveDays: 1,
        },
      },
      { $sort: { departmentName: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      count: summary.length,
      summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch department leave summary",
      error: error.message,
    });
  }
};

const getMonthlyLeaveSummary = async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year}-12-31T23:59:59.999Z`);

    const summary = await LeaveRequest.aggregate([
      {
        $match: {
          fromDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: { $month: "$fromDate" },
          totalRequests: { $sum: 1 },
          approvedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0] },
          },
          pendingRequests: {
            $sum: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
          },
          rejectedRequests: {
            $sum: { $cond: [{ $eq: ["$status", "REJECTED"] }, 1, 0] },
          },
          cancelledRequests: {
            $sum: { $cond: [{ $eq: ["$status", "CANCELLED"] }, 1, 0] },
          },
          totalLeaveDays: { $sum: "$totalDays" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      year,
      count: summary.length,
      summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly leave summary",
      error: error.message,
    });
  }
};

const getPendingApprovalsReport = async (req, res) => {
  try {
    const leaves = await LeaveRequest.find({ status: "PENDING" })
      .populate("userId", "employeeCode name email designation")
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
      message: "Failed to fetch pending approvals report",
      error: error.message,
    });
  }
};

const getApprovedRejectedSummary = async (req, res) => {
  try {
    const approvedCount = await LeaveRequest.countDocuments({ status: "APPROVED" });
    const rejectedCount = await LeaveRequest.countDocuments({ status: "REJECTED" });
    const cancelledCount = await LeaveRequest.countDocuments({ status: "CANCELLED" });
    const pendingCount = await LeaveRequest.countDocuments({ status: "PENDING" });

    return res.status(200).json({
      success: true,
      summary: {
        approvedCount,
        rejectedCount,
        cancelledCount,
        pendingCount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch approved/rejected summary",
      error: error.message,
    });
  }
};

const getLeaveBalanceReport = async (req, res) => {
  try {
    const { userId, year, leaveTypeId } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (year) query.year = Number(year);
    if (leaveTypeId) query.leaveTypeId = leaveTypeId;

    const balances = await LeaveBalance.find(query)
      .populate("userId", "employeeCode name email")
      .populate("leaveTypeId", "leaveName leaveCode")
      .sort({ year: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: balances.length,
      balances,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leave balance report",
      error: error.message,
    });
  }
};

module.exports = {
  getLeaveReport,
  getEmployeeLeaveHistoryReport,
  getDepartmentLeaveSummary,
  getMonthlyLeaveSummary,
  getPendingApprovalsReport,
  getApprovedRejectedSummary,
  getLeaveBalanceReport,
};
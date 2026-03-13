const LeaveRequest = require("../models/LeaveRequest");

const getAllLeavesForHR = async (req, res) => {
  try {
    const { status, employeeId, leaveTypeId, fromDate, toDate } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (employeeId) {
      query.userId = employeeId;
    }

    if (leaveTypeId) {
      query.leaveTypeId = leaveTypeId;
    }

    if (fromDate || toDate) {
      query.fromDate = {};
      if (fromDate) query.fromDate.$gte = new Date(fromDate);
      if (toDate) query.fromDate.$lte = new Date(toDate);
    }

    const leaves = await LeaveRequest.find(query)
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
      message: "Failed to fetch leaves for HR",
      error: error.message,
    });
  }
};

const getHRDashboardStats = async (req, res) => {
  try {
    const totalLeaves = await LeaveRequest.countDocuments();
    const pendingLeaves = await LeaveRequest.countDocuments({ status: "PENDING" });
    const approvedLeaves = await LeaveRequest.countDocuments({ status: "APPROVED" });
    const rejectedLeaves = await LeaveRequest.countDocuments({ status: "REJECTED" });
    const cancelledLeaves = await LeaveRequest.countDocuments({ status: "CANCELLED" });

    const recentLeaves = await LeaveRequest.find()
      .populate("userId", "employeeCode name email")
      .populate("leaveTypeId", "leaveName leaveCode")
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      stats: {
        totalLeaves,
        pendingLeaves,
        approvedLeaves,
        rejectedLeaves,
        cancelledLeaves,
      },
      recentLeaves,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch HR dashboard stats",
      error: error.message,
    });
  }
};

const getEmployeeLeaveHistoryForHR = async (req, res) => {
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
      message: "Failed to fetch employee leave history",
      error: error.message,
    });
  }
};

module.exports = {
  getAllLeavesForHR,
  getHRDashboardStats,
  getEmployeeLeaveHistoryForHR,
};
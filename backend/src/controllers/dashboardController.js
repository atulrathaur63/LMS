const LeaveRequest = require("../models/LeaveRequest");
const Holiday = require("../models/Holiday");
const User = require("../models/User");

const getHRDashboard = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const currentYear = today.getFullYear();
    const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);

    const [
      totalEmployees,
      activeEmployees,
      onLeaveToday,
      pendingApprovals,
      upcomingHolidays,
      statusSummary,
      monthlySummary,
      departmentSummary,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "ACTIVE" }),

      LeaveRequest.find({
        fromDate: { $lte: endOfDay },
        toDate: { $gte: startOfDay },
        status: "APPROVED",
      })
        .populate("userId", "employeeCode name email designation departmentId")
        .populate("leaveTypeId", "leaveName leaveCode")
        .sort({ fromDate: 1 }),

      LeaveRequest.find({
        status: { $in: ["PENDING", "CANCEL_PENDING"] },
      })
        .populate("userId", "employeeCode name email designation")
        .populate("leaveTypeId", "leaveName leaveCode")
        .populate("approverId", "employeeCode name email")
        .sort({ createdAt: -1 }),

      Holiday.find({
        holidayDate: { $gte: startOfDay },
        status: "ACTIVE",
      })
        .sort({ holidayDate: 1 })
        .limit(10),

      Promise.all([
        LeaveRequest.countDocuments({ status: "APPROVED" }),
        LeaveRequest.countDocuments({ status: "REJECTED" }),
        LeaveRequest.countDocuments({ status: "PENDING" }),
        LeaveRequest.countDocuments({ status: "CANCELLED" }),
        LeaveRequest.countDocuments({ status: "CANCEL_PENDING" }),
      ]),

      LeaveRequest.aggregate([
        {
          $match: {
            fromDate: { $gte: startOfYear, $lte: endOfYear },
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
            cancelPendingRequests: {
              $sum: { $cond: [{ $eq: ["$status", "CANCEL_PENDING"] }, 1, 0] },
            },
            totalLeaveDays: { $sum: "$totalDays" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      LeaveRequest.aggregate([
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
            cancelPendingRequests: {
              $sum: { $cond: [{ $eq: ["$status", "CANCEL_PENDING"] }, 1, 0] },
            },
            totalLeaveDays: { $sum: "$totalDays" },
          },
        },
        { $sort: { departmentName: 1 } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      dashboard: {
        employeeStats: {
          totalEmployees,
          activeEmployees,
          inactiveEmployees: totalEmployees - activeEmployees,
        },
        leaveToday: {
          count: onLeaveToday.length,
          employees: onLeaveToday,
        },
        pendingApprovals: {
          count: pendingApprovals.length,
          leaves: pendingApprovals,
        },
        upcomingHolidays: {
          count: upcomingHolidays.length,
          holidays: upcomingHolidays,
        },
        statusSummary: {
          approvedCount: statusSummary[0],
          rejectedCount: statusSummary[1],
          pendingCount: statusSummary[2],
          cancelledCount: statusSummary[3],
          cancelPendingCount: statusSummary[4],
        },
        monthlySummary: {
          year: currentYear,
          summary: monthlySummary,
        },
        departmentSummary,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch HR dashboard",
      error: error.message,
    });
  }
};

module.exports = {
  getHRDashboard,
};
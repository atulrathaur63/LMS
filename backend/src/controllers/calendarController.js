const LeaveRequest = require("../models/LeaveRequest");
const Holiday = require("../models/Holiday");
const User = require("../models/User");

const getMonthRange = (year, month) => {
  const start = new Date(Number(year), Number(month) - 1, 1);
  const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
  return { start, end };
};

const getMonthlyCalendar = async (req, res) => {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "year and month are required",
      });
    }

    const { start, end } = getMonthRange(year, month);

    const leaves = await LeaveRequest.find({
      fromDate: { $lte: end },
      toDate: { $gte: start },
      status: { $in: ["PENDING", "APPROVED"] },
    })
      .populate("userId", "employeeCode name email designation departmentId")
      .populate("leaveTypeId", "leaveName leaveCode")
      .populate("approverId", "employeeCode name email")
      .sort({ fromDate: 1 });

    const holidays = await Holiday.find({
      holidayDate: { $gte: start, $lte: end },
      status: "ACTIVE",
    }).sort({ holidayDate: 1 });

    return res.status(200).json({
      success: true,
      year,
      month,
      leaves,
      holidays,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly calendar",
      error: error.message,
    });
  }
};

const getManagerTeamCalendar = async (req, res) => {
  try {
    const managerId = req.user.id;
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "year and month are required",
      });
    }

    const { start, end } = getMonthRange(year, month);

    const teamMembers = await User.find({ reportingManagerId: managerId }).select("_id");
    const teamIds = teamMembers.map((u) => u._id);

    const leaves = await LeaveRequest.find({
      userId: { $in: teamIds },
      fromDate: { $lte: end },
      toDate: { $gte: start },
      status: { $in: ["PENDING", "APPROVED"] },
    })
      .populate("userId", "employeeCode name email designation")
      .populate("leaveTypeId", "leaveName leaveCode")
      .sort({ fromDate: 1 });

    const holidays = await Holiday.find({
      holidayDate: { $gte: start, $lte: end },
      status: "ACTIVE",
    }).sort({ holidayDate: 1 });

    return res.status(200).json({
      success: true,
      year,
      month,
      leaves,
      holidays,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch manager team calendar",
      error: error.message,
    });
  }
};

const getTodayOnLeave = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const leaves = await LeaveRequest.find({
      fromDate: { $lte: endOfDay },
      toDate: { $gte: startOfDay },
      status: "APPROVED",
    })
      .populate("userId", "employeeCode name email designation departmentId")
      .populate("leaveTypeId", "leaveName leaveCode")
      .sort({ fromDate: 1 });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch today's leave data",
      error: error.message,
    });
  }
};

const getUpcomingHolidays = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    const holidays = await Holiday.find({
      holidayDate: { $gte: startOfDay },
      status: "ACTIVE",
    })
      .sort({ holidayDate: 1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: holidays.length,
      holidays,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming holidays",
      error: error.message,
    });
  }
};

const getEmployeeMonthlyCalendar = async (req, res) => {
  try {
    const userId = req.params.userId;
    const year = Number(req.query.year);
    const month = Number(req.query.month);

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "year and month are required",
      });
    }

    const { start, end } = getMonthRange(year, month);

    const leaves = await LeaveRequest.find({
      userId,
      fromDate: { $lte: end },
      toDate: { $gte: start },
    })
      .populate("leaveTypeId", "leaveName leaveCode")
      .populate("approverId", "employeeCode name email")
      .sort({ fromDate: 1 });

    const holidays = await Holiday.find({
      holidayDate: { $gte: start, $lte: end },
      status: "ACTIVE",
    }).sort({ holidayDate: 1 });

    return res.status(200).json({
      success: true,
      year,
      month,
      leaves,
      holidays,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch employee monthly calendar",
      error: error.message,
    });
  }
};

module.exports = {
  getMonthlyCalendar,
  getManagerTeamCalendar,
  getTodayOnLeave,
  getUpcomingHolidays,
  getEmployeeMonthlyCalendar,
};
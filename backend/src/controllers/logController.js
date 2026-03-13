const ApprovalLog = require("../models/ApprovalLog");
const SystemLog = require("../models/SystemLog");

const getApprovalLogs = async (req, res) => {
  try {
    const logs = await ApprovalLog.find()
      .populate("leaveRequestId")
      .populate("actionBy", "employeeCode name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch approval logs",
      error: error.message,
    });
  }
};

const getSystemLogs = async (req, res) => {
  try {
    const logs = await SystemLog.find()
      .populate("performedBy", "employeeCode name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch system logs",
      error: error.message,
    });
  }
};

module.exports = {
  getApprovalLogs,
  getSystemLogs,
};
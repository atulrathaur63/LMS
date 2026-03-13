const express = require("express");
const router = express.Router();

const {
  getLeaveReport,
  getEmployeeLeaveHistoryReport,
  getDepartmentLeaveSummary,
  getMonthlyLeaveSummary,
  getPendingApprovalsReport,
  getApprovedRejectedSummary,
  getLeaveBalanceReport,
} = require("../controllers/reportController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.get("/leaves", protect, allowRoles("HR", "ADMIN", "SUPER_ADMIN"), getLeaveReport);
router.get("/employee/:userId", protect, allowRoles("HR", "ADMIN", "SUPER_ADMIN"), getEmployeeLeaveHistoryReport);
router.get("/department-summary", protect, allowRoles("HR", "ADMIN", "SUPER_ADMIN"), getDepartmentLeaveSummary);
router.get("/monthly-summary", protect, allowRoles("HR", "ADMIN", "SUPER_ADMIN"), getMonthlyLeaveSummary);
router.get("/pending-approvals", protect, allowRoles("HR", "ADMIN", "SUPER_ADMIN"), getPendingApprovalsReport);
router.get("/status-summary", protect, allowRoles("HR", "ADMIN", "SUPER_ADMIN"), getApprovedRejectedSummary);
router.get("/leave-balances", protect, allowRoles("HR", "ADMIN", "SUPER_ADMIN"), getLeaveBalanceReport);

module.exports = router;
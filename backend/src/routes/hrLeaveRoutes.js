const express = require("express");
const router = express.Router();

const {
  getAllLeavesForHR,
  getHRDashboardStats,
  getEmployeeLeaveHistoryForHR,
} = require("../controllers/hrLeaveController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.get("/dashboard", protect, allowRoles("HR", "ADMIN", "SUPER_ADMIN"), getHRDashboardStats);
router.get("/all", protect, allowRoles("HR", "ADMIN", "SUPER_ADMIN"), getAllLeavesForHR);
router.get("/employee/:userId", protect, allowRoles("HR", "ADMIN", "SUPER_ADMIN"), getEmployeeLeaveHistoryForHR);

module.exports = router;
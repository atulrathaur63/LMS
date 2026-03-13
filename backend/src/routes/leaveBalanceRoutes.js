const express = require("express");
const router = express.Router();

const {
  createLeaveBalance,
  getAllLeaveBalances,
  getUserLeaveBalances,
} = require("../controllers/leaveBalanceController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.post("/", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR"), createLeaveBalance);
router.get("/", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR"), getAllLeaveBalances);
router.get("/user/:userId", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "EMPLOYEE"), getUserLeaveBalances);

module.exports = router;
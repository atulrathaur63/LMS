const express = require("express");
const router = express.Router();

const {
  createLeaveBalance,
  getAllLeaveBalances,
  getUserLeaveBalances,
  getMyLeaveBalances,
  updateLeaveBalance,
  manualUpdateLeaveBalance,
} = require("../controllers/leaveBalanceController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.get("/my", protect, getMyLeaveBalances);

router.get(
  "/user/:userId",
  protect,
  allowRoles("HR", "ADMIN", "SUPER_ADMIN", "MANAGER"),
  getUserLeaveBalances
);

router.get(
  "/",
  protect,
  allowRoles("HR", "ADMIN", "SUPER_ADMIN"),
  getAllLeaveBalances
);

router.post(
  "/allocate",
  protect,
  allowRoles("HR", "ADMIN", "SUPER_ADMIN"),
  createLeaveBalance
);

router.put(
  "/:id",
  protect,
  allowRoles("HR", "ADMIN", "SUPER_ADMIN"),
  updateLeaveBalance
);

router.patch(
  "/manual-update",
  protect,
  allowRoles("HR", "ADMIN", "SUPER_ADMIN"),
  manualUpdateLeaveBalance
);

module.exports = router;
const express = require("express");
const router = express.Router();

const {
  createLeaveType,
  getAllLeaveTypes,
  getSingleLeaveType,
  updateLeaveType,
  updateLeaveTypeStatus,
  deleteLeaveType,
} = require("../controllers/leaveTypeController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.post("/", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR"), createLeaveType);
router.get("/", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "EMPLOYEE"), getAllLeaveTypes);
router.get("/:id", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "EMPLOYEE"), getSingleLeaveType);

router.put(
  "/:id",
  protect,
  allowRoles("SUPER_ADMIN","ADMIN","HR"),
  updateLeaveType
);

router.patch(
  "/:id/status",
  protect,
  allowRoles("SUPER_ADMIN","ADMIN","HR"),
  updateLeaveTypeStatus
);

router.delete(
  "/:id",
  protect,
  allowRoles("SUPER_ADMIN","ADMIN"),
  deleteLeaveType
);

module.exports = router;
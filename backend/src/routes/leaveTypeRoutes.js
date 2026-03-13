const express = require("express");
const router = express.Router();

const {
  createLeaveType,
  getAllLeaveTypes,
  getSingleLeaveType,
} = require("../controllers/leaveTypeController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.post("/", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR"), createLeaveType);
router.get("/", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "EMPLOYEE"), getAllLeaveTypes);
router.get("/:id", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "EMPLOYEE"), getSingleLeaveType);

module.exports = router;
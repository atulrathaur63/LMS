const express = require("express");
const router = express.Router();

const {
  applyLeave,
  getMyLeaves,
  getSingleLeave,
  cancelMyLeave,
} = require("../controllers/leaveRequestController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.post("/", protect, allowRoles("EMPLOYEE", "MANAGER", "HR", "ADMIN", "SUPER_ADMIN"), applyLeave);
router.get("/my", protect, allowRoles("EMPLOYEE", "MANAGER", "HR", "ADMIN", "SUPER_ADMIN"), getMyLeaves);
router.get("/:id", protect, allowRoles("EMPLOYEE", "MANAGER", "HR", "ADMIN", "SUPER_ADMIN"), getSingleLeave);
router.put("/cancel/:id", protect, allowRoles("EMPLOYEE", "MANAGER", "HR", "ADMIN", "SUPER_ADMIN"), cancelMyLeave);

module.exports = router;
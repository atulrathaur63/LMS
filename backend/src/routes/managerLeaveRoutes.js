const express = require("express");
const router = express.Router();

const {
  getTeamLeaves,
  managerAction,
  cancelApprove,
  cancelReject,
} = require("../controllers/managerLeaveController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.get(
  "/team",
  protect,
  allowRoles("MANAGER", "HR", "ADMIN", "SUPER_ADMIN"),
  getTeamLeaves
);

router.put(
  "/action/:id",
  protect,
  allowRoles("MANAGER", "HR", "ADMIN", "SUPER_ADMIN"),
  managerAction
);

router.patch(
  "/:id/cancel-approve",
  protect,
  allowRoles("MANAGER", "HR", "ADMIN", "SUPER_ADMIN"),
  cancelApprove
);

router.patch(
  "/:id/cancel-reject",
  protect,
  allowRoles("MANAGER", "HR", "ADMIN", "SUPER_ADMIN"),
  cancelReject
);

module.exports = router;
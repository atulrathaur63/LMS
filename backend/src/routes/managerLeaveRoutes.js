const express = require("express");
const router = express.Router();

const {
  getTeamLeaves,
  managerAction
} = require("../controllers/managerLeaveController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.get(
  "/team",
  protect,
  allowRoles("MANAGER"),
  getTeamLeaves
);

router.put(
  "/action/:id",
  protect,
  allowRoles("MANAGER"),
  managerAction
);

module.exports = router;
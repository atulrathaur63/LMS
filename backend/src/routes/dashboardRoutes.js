const express = require("express");
const router = express.Router();

const { getHRDashboard } = require("../controllers/dashboardController");
const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.get(
  "/hr",
  protect,
  allowRoles("HR", "ADMIN", "SUPER_ADMIN"),
  getHRDashboard
);

module.exports = router;
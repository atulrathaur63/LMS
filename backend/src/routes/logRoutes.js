const express = require("express");
const router = express.Router();

const { getApprovalLogs, getSystemLogs } = require("../controllers/logController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

router.get(
  "/approval",
  protect,
  allowRoles("HR", "ADMIN", "SUPER_ADMIN"),
  getApprovalLogs
);

router.get(
  "/system",
  protect,
  allowRoles("HR", "ADMIN", "SUPER_ADMIN"),
  getSystemLogs
);

module.exports = router;
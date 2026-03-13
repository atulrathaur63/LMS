const express = require("express");
const router = express.Router();

const {
  createRole,
  getAllRoles,
  getSingleRole,
} = require("../controllers/roleController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.post("/", protect, allowRoles("SUPER_ADMIN"), createRole);
router.get("/", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR"), getAllRoles);
router.get("/:id", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR"), getSingleRole);

module.exports = router;
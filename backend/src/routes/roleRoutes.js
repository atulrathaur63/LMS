const express = require("express");
const router = express.Router();

const {
  createRole,
  getRoles,
  updateRole,
  deleteRole,
} = require("../controllers/roleController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.get("/", protect, getRoles);

router.post(
  "/",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN", "HR"),
  createRole
);

router.put(
  "/:id",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN", "HR"),
  updateRole
);

router.delete(
  "/:id",
  protect,
  allowRoles("ADMIN", "SUPER_ADMIN"),
  deleteRole
);

module.exports = router;
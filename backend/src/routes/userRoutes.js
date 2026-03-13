const express = require("express");
const router = express.Router();

const {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  updateUserStatus,
  updateUserApprover,
} = require("../controllers/userController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.post("/", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR"), createUser);
router.get("/", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR"), getAllUsers);
router.get("/:id", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR"), getSingleUser);
router.put("/:id", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR"), updateUser);

router.patch(
  "/:id/status",
  protect,
  allowRoles("SUPER_ADMIN","ADMIN","HR"),
  updateUserStatus
);

router.patch(
  "/:id/approver",
  protect,
  allowRoles("SUPER_ADMIN","ADMIN","HR"),
  updateUserApprover
);

module.exports = router;
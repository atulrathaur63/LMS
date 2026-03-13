const express = require("express");
const router = express.Router();

const {
  createDepartment,
  getAllDepartments,
  getSingleDepartment,
} = require("../controllers/departmentController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.post("/", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR"), createDepartment);
router.get("/", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR"), getAllDepartments);
router.get("/:id", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR"), getSingleDepartment);

module.exports = router;
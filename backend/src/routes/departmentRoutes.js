const express = require("express");
const router = express.Router();

const {
  createDepartment,
  getAllDepartments,
  getSingleDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.post("/", protect, allowRoles("SUPER_ADMIN","ADMIN","HR"), createDepartment);

router.get("/", protect, allowRoles("SUPER_ADMIN","ADMIN","HR"), getAllDepartments);

router.get("/:id", protect, allowRoles("SUPER_ADMIN","ADMIN","HR"), getSingleDepartment);

router.put("/:id", protect, allowRoles("SUPER_ADMIN","ADMIN","HR"), updateDepartment);

router.delete("/:id", protect, allowRoles("SUPER_ADMIN","ADMIN"), deleteDepartment);

module.exports = router;
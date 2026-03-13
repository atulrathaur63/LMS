const express = require("express");
const router = express.Router();

const {
  createHoliday,
  getAllHolidays,
} = require("../controllers/holidayController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.post("/", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR"), createHoliday);
router.get("/", protect, allowRoles("SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "EMPLOYEE"), getAllHolidays);

module.exports = router;
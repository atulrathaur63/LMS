const express = require("express");
const router = express.Router();

const {
  getMonthlyCalendar,
  getManagerTeamCalendar,
  getTodayOnLeave,
  getUpcomingHolidays,
  getEmployeeMonthlyCalendar,
} = require("../controllers/calendarController");

const { protect } = require("../middlewares/authMiddleware");
const { allowRoles } = require("../middlewares/roleMiddleware");

router.get("/monthly", protect, allowRoles("HR", "ADMIN", "SUPER_ADMIN"), getMonthlyCalendar);
router.get("/team", protect, allowRoles("MANAGER"), getManagerTeamCalendar);
router.get("/today-on-leave", protect, allowRoles("HR", "ADMIN", "SUPER_ADMIN", "MANAGER"), getTodayOnLeave);
router.get("/upcoming-holidays", protect, allowRoles("HR", "ADMIN", "SUPER_ADMIN", "MANAGER", "EMPLOYEE"), getUpcomingHolidays);
router.get("/employee/:userId", protect, allowRoles("HR", "ADMIN", "SUPER_ADMIN", "MANAGER", "EMPLOYEE"), getEmployeeMonthlyCalendar);

module.exports = router;
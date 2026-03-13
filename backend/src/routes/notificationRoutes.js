const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../controllers/notificationController");

const { protect } = require("../middlewares/authMiddleware");

router.get("/my", protect, getMyNotifications);
router.put("/read-all", protect, markAllNotificationsAsRead);
router.put("/read/:id", protect, markNotificationAsRead);

module.exports = router;
const Notification = require("../models/Notification");

const createNotification = async ({
  userId,
  title,
  message,
  type = "GENERAL",
  referenceId = null,
  referenceModel = "",
}) => {
  try {
    return await Notification.create({
      userId,
      title,
      message,
      type,
      referenceId,
      referenceModel,
    });
  } catch (error) {
    console.error("Notification creation failed:", error.message);
    return null;
  }
};

module.exports = {
  createNotification,
};
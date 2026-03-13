const Holiday = require("../models/Holiday");

const createHoliday = async (req, res) => {
  try {
    const { holidayName, holidayDate, description, isOptional, status } = req.body || {};

    if (!holidayName || !holidayDate) {
      return res.status(400).json({
        success: false,
        message: "holidayName and holidayDate are required",
      });
    }

    const existingHoliday = await Holiday.findOne({
      holidayName: holidayName.trim(),
      holidayDate: new Date(holidayDate),
    });

    if (existingHoliday) {
      return res.status(409).json({
        success: false,
        message: "Holiday already exists",
      });
    }

    const holiday = await Holiday.create({
      holidayName: holidayName.trim(),
      holidayDate: new Date(holidayDate),
      description: description || "",
      isOptional: isOptional ?? false,
      status: status || "ACTIVE",
    });

    return res.status(201).json({
      success: true,
      message: "Holiday created successfully",
      holiday,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create holiday",
      error: error.message,
    });
  }
};

const getAllHolidays = async (req, res) => {
  try {
    const { year } = req.query;
    const query = {};

    if (year) {
      const start = new Date(`${year}-01-01`);
      const end = new Date(`${year}-12-31T23:59:59.999Z`);
      query.holidayDate = { $gte: start, $lte: end };
    }

    const holidays = await Holiday.find(query).sort({ holidayDate: 1 });

    return res.status(200).json({
      success: true,
      count: holidays.length,
      holidays,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch holidays",
      error: error.message,
    });
  }
};

module.exports = {
  createHoliday,
  getAllHolidays,
};
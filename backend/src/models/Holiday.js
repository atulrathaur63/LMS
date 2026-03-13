const mongoose = require("mongoose");

const holidaySchema = new mongoose.Schema(
  {
    holidayName: {
      type: String,
      required: true,
      trim: true,
    },
    holidayDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

holidaySchema.index({ holidayDate: 1, holidayName: 1 }, { unique: true });

module.exports = mongoose.model("Holiday", holidaySchema);
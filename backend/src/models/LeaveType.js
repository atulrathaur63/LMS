const mongoose = require("mongoose");

const leaveTypeSchema = new mongoose.Schema(
  {
    leaveName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    leaveCode: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      uppercase: true,
    },
    totalPerYear: {
      type: Number,
      required: true,
      min: 0,
    },
    isPaid: {
      type: Boolean,
      default: true,
    },
    carryForward: {
      type: Boolean,
      default: false,
    },
    requiresAttachment: {
      type: Boolean,
      default: false,
    },
    allowHalfDay: {
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

module.exports = mongoose.model("LeaveType", leaveTypeSchema);
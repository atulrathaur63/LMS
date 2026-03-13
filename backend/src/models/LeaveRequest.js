const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportingManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 0.5,
    },
    leaveSession: {
      type: String,
      enum: ["FULL_DAY", "FIRST_HALF", "SECOND_HALF", "SHORT_LEAVE"],
      default: "FULL_DAY",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    attachment: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
        "CANCEL_PENDING",
      ],
      default: "PENDING",
    },

    managerActionAt: {
      type: Date,
      default: null,
    },
    hrActionAt: {
      type: Date,
      default: null,
    },

    approverComment: {
      type: String,
      default: "",
      trim: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    hrNotifiedAt: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
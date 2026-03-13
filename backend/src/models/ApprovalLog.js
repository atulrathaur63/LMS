const mongoose = require("mongoose");

const approvalLogSchema = new mongoose.Schema(
  {
    leaveRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveRequest",
      required: true,
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "SUBMITTED",
        "APPROVED",
        "REJECTED",
        "CANCEL_REQUESTED",
        "CANCELLED",
        "CANCEL_APPROVED",
        "CANCEL_REJECTED",
      ],
      required: true,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ApprovalLog", approvalLogSchema);
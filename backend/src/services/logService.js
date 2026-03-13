const ApprovalLog = require("../models/ApprovalLog");
const SystemLog = require("../models/SystemLog");

const createApprovalLog = async ({
  leaveRequestId,
  actionBy,
  action,
  comment = "",
}) => {
  return ApprovalLog.create({
    leaveRequestId,
    actionBy,
    action,
    comment,
  });
};

const createSystemLog = async ({
  action,
  entity,
  entityId = null,
  performedBy = null,
  details = {},
}) => {
  return SystemLog.create({
    action,
    entity,
    entityId,
    performedBy,
    details,
  });
};

module.exports = {
  createApprovalLog,
  createSystemLog,
};
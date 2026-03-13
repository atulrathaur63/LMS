const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.roleCode) {
      return res.status(403).json({
        success: false,
        message: "Role information missing",
      });
    }

    if (!allowedRoles.includes(req.user.roleCode)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  };
};

module.exports = { allowRoles };
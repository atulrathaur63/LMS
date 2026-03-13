const crypto = require("crypto");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { createSystemLog } = require("../services/logService");

const login = async (req, res) => {
  try {
    console.log("Login req.body:", req.body);

    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .populate("roleId", "roleName roleCode permissions status")
      .populate("departmentId", "departmentName departmentCode status")
      .populate("approverId", "name email employeeCode")
      .populate("reportingManagerId", "name email employeeCode");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        employeeCode: user.employeeCode,
        name: user.name,
        email: user.email,
        phone: user.phone,
        designation: user.designation,
        joiningDate: user.joiningDate,
        status: user.status,
        role: user.roleId,
        department: user.departmentId,
        approver: user.approverId,
        reportingManager: user.reportingManagerId,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // security reason: same generic response
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a reset link/token has been generated.",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    await createSystemLog({
      action: "PASSWORD_RESET_REQUESTED",
      entity: "User",
      entityId: user._id,
      performedBy: user._id,
      details: {
        email: user.email,
      },
    });

    // Phase 1: return token in API for testing/postman
    // Later email service se reset link bhej denge
    return res.status(200).json({
      success: true,
      message: "Password reset token generated successfully",
      resetToken,
      expiresInMinutes: 15,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Forgot password request failed",
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body || {};

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Token, password, and confirmPassword are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    user.passwordHash = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    await createSystemLog({
      action: "PASSWORD_RESET_COMPLETED",
      entity: "User",
      entityId: user._id,
      performedBy: user._id,
      details: {
        email: user.email,
      },
    });

    const jwtToken = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
      token: jwtToken,
      user: {
        id: user._id,
        employeeCode: user.employeeCode,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Reset password failed",
      error: error.message,
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-passwordHash")
      .populate("roleId", "roleName roleCode permissions status")
      .populate("departmentId", "departmentName departmentCode status")
      .populate("approverId", "name email employeeCode")
      .populate("reportingManagerId", "name email employeeCode");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

module.exports = {
  login,
  forgotPassword,
  resetPassword,
  getMe,
};
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const leaveTypeRoutes = require("./routes/leaveTypeRoutes");
const leaveBalanceRoutes = require("./routes/leaveBalanceRoutes");
const leaveRequestRoutes = require("./routes/leaveRequestRoutes");
const managerLeaveRoutes = require("./routes/managerLeaveRoutes");
const hrLeaveRoutes = require("./routes/hrLeaveRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const reportRoutes = require("./routes/reportRoutes");
const calendarRoutes = require("./routes/calendarRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({ message: "Leave Management System API Running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/leave-types", leaveTypeRoutes);
app.use("/api/leave-balances", leaveBalanceRoutes);
app.use("/api/leave-requests", leaveRequestRoutes);
app.use("/api/manager/leaves", managerLeaveRoutes);
app.use("/api/hr/leaves", hrLeaveRoutes);
app.use("/api/holidays", holidayRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/logs", require("./routes/logRoutes"));
app.use("/api/dashboard", dashboardRoutes);

module.exports = app;
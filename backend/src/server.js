require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

connectDB();

// register models
require("./models/Role");
require("./models/Department");
require("./models/User");
require("./models/LeaveType");
require("./models/LeaveBalance");
require("./models/LeaveRequest");
require("./models/Holiday");
require("./models/Notification");

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
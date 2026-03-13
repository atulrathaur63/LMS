require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const Role = require("../models/Role");
const Department = require("../models/Department");
const User = require("../models/User");

const seedAdmin = async () => {
  try {
    await connectDB();

    let superAdminRole = await Role.findOne({ roleCode: "SUPER_ADMIN" });

    if (!superAdminRole) {
      superAdminRole = await Role.create({
        roleName: "Super Admin",
        roleCode: "SUPER_ADMIN",
        description: "System owner with full access",
        permissions: ["ALL_ACCESS"],
        status: "ACTIVE",
      });
      console.log("Super Admin role created");
    } else {
      console.log("Super Admin role already exists");
    }

    let adminDepartment = await Department.findOne({ departmentCode: "ADMIN" });

    if (!adminDepartment) {
      adminDepartment = await Department.create({
        departmentName: "Administration",
        departmentCode: "ADMIN",
        description: "Administration Department",
        status: "ACTIVE",
      });
      console.log("Administration department created");
    } else {
      console.log("Administration department already exists");
    }

    const existingAdmin = await User.findOne({ email: "admin@example.com" });

    if (!existingAdmin) {
      await User.create({
        employeeCode: "EMP001",
        name: "Super Admin",
        email: "admin@example.com",
        passwordHash: "Admin@123",
        phone: "9999999999",
        roleId: superAdminRole._id,
        departmentId: adminDepartment._id,
        designation: "System Owner",
        approverId: null,
        reportingManagerId: null,
        joiningDate: new Date("2026-01-01"),
        status: "ACTIVE",
      });

      console.log("Super Admin user created");
      console.log("Login Email: admin@example.com");
      console.log("Login Password: Admin@123");
    } else {
      console.log("Super Admin user already exists");
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedAdmin();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../src/models/user.model");

dotenv.config();

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      email: "admin@medora.com",
      role: "admin",
    });
    if (existingAdmin) {
      console.log("Admin user already exists!");
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User({
      email: "admin@medora.com",
      password: "admin123", // Password will be hashed automatically
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      phone: "+1234567890",
      isActive: true,
    });

    await adminUser.save();

    console.log("✅ Admin user created successfully!");
    console.log("Email: admin@medora.com");
    console.log("Password: admin123");
    console.log("\nYou can now login at: http://localhost:3000/admin/login");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin user:", error.message);
    process.exit(1);
  }
};

seedAdmin();

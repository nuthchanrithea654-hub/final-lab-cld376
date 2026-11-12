
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

// Same MongoDB collection used by Registration Service
const studentSchema = new mongoose.Schema({
  Student_id: String,
  Student_name: String,
  student_email: String,
  student_password: String
}, { collection: "students" });

const Student = mongoose.model("Student", studentSchema);

// Login API
app.post("/login", async (req, res) => {
  try {
    const { student_email, student_password } = req.body;

    // Validate input
    if (typeof student_email !== "string" ||
        typeof student_password !== "string" ||
        !student_email.trim() || !student_password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Find student by email
    const student = await Student.findOne({
      student_email: student_email.trim().toLowerCase()
    });

    if (!student) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Compare password with stored hash
    const isMatch = await bcrypt.compare(
      student_password,
      student.student_password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        Student_id: student.Student_id,
        student_email: student.student_email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Successful login
    res.status(200).json({
      message: "Login successful",
      token: token,
      student: {
        Student_id: student.Student_id,
        Student_name: student.Student_name,
        student_email: student.student_email
      }
    });

  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      message: "Internal server error"
    });
  }
});

// Health Check API
app.get("/health", (req, res) => {
  res.json({
    service: "Login",
    status: "Running"
  });
});

// MongoDB Connection
const PORT = process.env.PORT || 3002;

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("MONGO_URI and JWT_SECRET are required");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Login Service running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });


require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());

// Student Database Schema
const studentSchema = new mongoose.Schema({
  Student_id: { type: String, required: true, unique: true },
  Student_name: { type: String, required: true },
  student_mobile: { type: String, required: true },
  student_email: { type: String, required: true, unique: true, lowercase: true },
  student_password: { type: String, required: true }
});

const Student = mongoose.model("Student", studentSchema);

// Registration API
app.post("/register", async (req, res) => {
  try {
    const {
      Student_id,
      Student_name,
      student_mobile,
      student_email,
      student_password
    } = req.body;

    if (!Student_id || !Student_name || !student_mobile ||
        !student_email || !student_password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await Student.findOne({
      $or: [
        { Student_id },
        { student_email: student_email.toLowerCase() }
      ]
    });

    if (existing) {
      return res.status(409).json({ message: "Student already exists" });
    }

    const hashedPassword = await bcrypt.hash(student_password, 10);

    const student = await Student.create({
      Student_id,
      Student_name,
      student_mobile,
      student_email: student_email.toLowerCase(),
      student_password: hashedPassword
    });

    res.status(201).json({
      message: "Student registered successfully",
      Student_id: student.Student_id,
      Student_name: student.Student_name,
      student_email: student.student_email
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Student already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Retrieve Student
app.get("/students/:id", async (req, res) => {
  try {
    const student = await Student.findOne({
      Student_id: req.params.id
    }).select("-student_password");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update Student
app.put("/students/:id", async (req, res) => {
  try {
    const updates = {};
    const allowed = [
      "Student_name", "student_mobile", "student_email", "student_password"
    ];

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.student_email) {
      updates.student_email = updates.student_email.toLowerCase();
    }

    if (updates.student_password) {
      updates.student_password = await bcrypt.hash(updates.student_password, 10);
    }

    const student = await Student.findOneAndUpdate(
      { Student_id: req.params.id },
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-student_password");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({ message: "Student updated successfully", student });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// Health Check
app.get("/health", (req, res) => {
  res.json({ service: "Registration", status: "Running" });
});

// Database Connection
const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Registration Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });

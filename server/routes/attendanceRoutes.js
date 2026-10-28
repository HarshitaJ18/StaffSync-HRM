const express = require("express");
const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Provide a date in YYYY-MM-DD format" });
    }
    const records = await Attendance.find({ date })
      .populate("employee", "name email department position")
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { employeeId, date, status } = req.body;
    if (!mongoose.isValidObjectId(employeeId)) {
      return res.status(400).json({ message: "Valid employee ID is required" });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Date must be in YYYY-MM-DD format" });
    }
    if (!["Present", "Absent", "On Leave"].includes(status)) {
      return res.status(400).json({ message: "Invalid attendance status" });
    }
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const record = await Attendance.findOneAndUpdate(
      { employee: employeeId, date },
      { $set: { status } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    await record.populate("employee", "name email department position");
    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;

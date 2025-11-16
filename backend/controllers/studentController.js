// controllers/studentController.js
const Student = require("../models/Student");

// @desc    Get student profile
// @route   GET /api/students/:id
// @access  Private

const getStudentsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const students = await Student.find({ classroom: classId }).select(
      "firstname lastname username gender email"
    );

    if (students.length === 0) {
      return res.status(404).json({ message: "No students found in this class" });
    }

    res.json(students);
  } catch (error) {
    console.error("Error fetching class students:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getStudentProfile = async (req, res) => {
  try {
    const studentId = req.params.id;
    const student = await Student.findById(studentId).select("-password");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update student profile
// @route   PUT /api/students/:id
// @access  Private
const updateStudentProfile = async (req, res) => {
  try {
    const studentId = req.params.id;

    const updatedData = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      gender: req.body.gender,
      birthMonth: req.body.birthMonth,
      birthDay: req.body.birthDay,
      birthYear: req.body.birthYear,
      accountType: req.body.accountType,
      gradeLevel: req.body.gradeLevel,
      section: req.body.section
    };

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updatedData,
      { new: true }
    ).select("-password");

    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      message: "Profile updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getStudentProfile,
  updateStudentProfile,
  getStudentsByClass,
};

// controllers/classController.js
const Class = require("../models/Class");
const Student = require("../models/Student");
const Quiz = require("../models/Quiz");
const Lobby = require("../models/Lobby");
const mongoose = require("mongoose");

function generateClassCode() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Create class (Teacher)
exports.createClass = async (req, res) => {
  try {
    const { gradeLevel, section, subject } = req.body;

    if (!gradeLevel || !section || !subject) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const classCode = generateClassCode();

    const newClass = new Class({
      gradeLevel,
      section,
      subject,
      classCode,
      teacher: req.user.id,
    });

    await newClass.save();

    res.status(201).json({
      message: "Class created successfully",
      classroom: newClass,
    });
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Teacher view their classes
exports.getMyClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const classes = await Class.find({ teacher: teacherId });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Teacher view class details (with students)
exports.getClassDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const classrooms = await Class.findById(id).populate("teacher", "firstname lastname avatar");

    if (!classrooms) return res.status(404).json({ message: "Class not found" });

    const students = await Student.find({ classrooms: id }); // ✅ FIXED: replaced classId → classroom

    res.json({
      classrooms,
      teacher: {
        firstname: classrooms.teacher.firstname,
        lastname: classrooms.teacher.lastname,
        avatar: classrooms.teacher.avatar || null,
      },
      students,
    });
  } catch (error) {
    console.error("Error fetching class details:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.enrollStudent = async (req, res) => {
  try {
    const { classCode } = req.body;
    const studentId = req.user.id;

    const classDoc = await Class.findOne({ classCode });
    if (!classDoc) return res.status(404).json({ message: "Class not found" });

    // Check if student already in this class
    if (classDoc.students.includes(studentId)) {
      return res.status(400).json({ message: "Already enrolled in this class" });
    }

    // Add student to class
    classDoc.students.push(studentId);
    await classDoc.save();

    // ✅ Update student's classrooms array (not single classroom)
    await Student.findByIdAndUpdate(
      studentId,
      { $addToSet: { classrooms: classDoc._id } }, // prevents duplicates
      { new: true }
    );

    res.status(200).json({ message: "Enrolled successfully!", classId: classDoc._id });
  } catch (error) {
    console.error("Error enrolling student:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Student leaves classroom
exports.leaveClassroom = async (req, res) => {
  try {
    const { classId } = req.body;
    const studentId = req.user.id;

    if (!classId) {
      return res.status(400).json({ message: "Class ID is required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "Invalid class ID format" });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check if student is enrolled in this class
    const isEnrolled = classDoc.students.some(
      (id) => id.toString() === studentId.toString()
    );
    if (!isEnrolled) {
      return res.status(400).json({ message: "You are not enrolled in this class" });
    }

    // Remove student from class
    classDoc.students = classDoc.students.filter(
      (id) => id.toString() !== studentId.toString()
    );
    await classDoc.save();

    // Remove class from student's classrooms array
    await Student.findByIdAndUpdate(
      studentId,
      { $pull: { classrooms: classId } },
      { new: true }
    );

    res.status(200).json({ message: "Left classroom successfully" });
  } catch (error) {
    console.error("Error leaving classroom:", error);
    res.status(500).json({ message: "Server error" });
  }
};



exports.getStudentClass = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).populate({
      path: "classrooms",
      populate: {
        path: "teacher",
        select: "firstname lastname avatar subject section gradeLevel classCode",
      },
    });

    // Instead of 404, return 200 and classroom: null when not joined
    if (!student || !student.classrooms) {
      return res.status(200).json({ classrooms: null, message: "You haven't joined any class yet." });
    }

    // Found class — return it
    return res.status(200).json({ classrooms: student.classrooms });
  } catch (error) {
    console.error("Error fetching student class:", error);
    return res.status(500).json({ message: "Server error" });
  }
};



exports.removeStudent = async (req, res) => {
  try {
    const { classId, studentId } = req.body;

    if (!classId || !studentId) {
      return res.status(400).json({ message: "classId and studentId are required" });
    }

    const classrooms = await Class.findById(classId);
    if (!classrooms) return res.status(404).json({ message: "Class not found" });

    if (req.user.role !== "teacher" || req.user.id !== classrooms.teacher.toString()) {
      return res.status(403).json({ message: "Forbidden: you are not the teacher of this class" });
    }

    // Remove from class.students
    classrooms.students = classrooms.students.filter((id) => id.toString() !== studentId);
    await classrooms.save();

    // ✅ Remove this class from the student's classrooms array
    await Student.findByIdAndUpdate(studentId, {
      $pull: { classrooms: classId },
    });

    return res.json({ message: "Student removed from class" });
  } catch (error) {
    console.error("Error removing student:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


// Get all classes a student has joined
exports.getStudentClasses = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id).populate({
      path: "classrooms",
      populate: {
        path: "teacher",
        select: "firstname lastname avatar",
      },
    });

    if (!student || !student.classrooms || student.classrooms.length === 0) {
      return res.status(200).json({ classrooms: [], message: "You haven't joined any classes yet." });
    }

    res.status(200).json({ classrooms: student.classrooms });
  } catch (error) {
    console.error("Error fetching student classes:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete classroom (Teacher only) - Cascades to delete quizzes, lobbies, and remove students
exports.deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user.id;

    if (!classId) {
      return res.status(400).json({ message: "Class ID is required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "Invalid class ID format" });
    }

    // Find the class
    const classroom = await Class.findById(classId);
    if (!classroom) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Verify teacher owns this class
    if (classroom.teacher.toString() !== teacherId) {
      return res.status(403).json({ message: "Forbidden: you are not the teacher of this class" });
    }

    // Find all quizzes associated with this class
    const quizzes = await Quiz.find({ classId: classId });
    const quizIds = quizzes.map(quiz => quiz._id);

    // Delete all lobbies associated with those quizzes
    if (quizIds.length > 0) {
      await Lobby.deleteMany({ quizId: { $in: quizIds } });
    }

    // Delete any lobbies directly associated with the class (if any)
    await Lobby.deleteMany({ classId: classId });

    // Delete all quizzes associated with this class
    await Quiz.deleteMany({ classId: classId });

    // Remove this class from all enrolled students' classrooms array
    await Student.updateMany(
      { classrooms: classId },
      { $pull: { classrooms: classId } }
    );

    // Delete the class
    await Class.findByIdAndDelete(classId);

    res.status(200).json({ 
      message: "Classroom deleted successfully. All associated quizzes, lobbies, and student enrollments have been removed.",
      deletedClassroom: {
        id: classroom._id,
        subject: classroom.subject,
        gradeLevel: classroom.gradeLevel,
        section: classroom.section
      }
    });
  } catch (error) {
    console.error("Error deleting classroom:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};




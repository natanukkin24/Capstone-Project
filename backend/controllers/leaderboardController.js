const Class = require("../models/Class");
const Student = require("../models/Student");

// GET leaderboard for a specific class
exports.getLeaderboard = async (req, res) => {
  try {
    const { classId } = req.params;

    // Find the class and populate its students
    const classroom = await Class.findById(classId)
      .populate({
        path: "students",
        select: "firstname lastname username points profileImage", // adjust fields as needed
      })
      .exec();

    if (!classroom) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Sort by points descending
    const sortedStudents = classroom.students.sort((a, b) => b.points - a.points);

    res.status(200).json({
      classId: classroom._id,
      subject: classroom.subject,
      gradeLevel: classroom.gradeLevel,
      leaderboard: sortedStudents,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Server error" });
  }
};

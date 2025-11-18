const express = require("express");
const router = express.Router();

const { authenticate, authorize } = require("../middleware/auth");
const {
  createClass,
  getMyClasses,
  getClassDetails,
  enrollStudent,
  getStudentClass,
  getStudentClasses,
  removeStudent,
  deleteClass,
  leaveClassroom,
} = require("../controllers/classController");
const { getLeaderboard } = require("../controllers/leaderboardController");

// ------------------- ROUTE ORDER MATTERS -------------------

// ✅ Enroll student
router.post("/enroll", authenticate, authorize(["student"]), enrollStudent);

// ✅ Student leaves classroom
router.post("/leave-classroom", authenticate, authorize(["student"]), leaveClassroom);

// ✅ Create class (teacher)
router.post("/", authenticate, authorize(["teacher"]), createClass);

// ✅ Remove student (teacher)
router.post("/remove-student", authenticate, authorize(["teacher"]), removeStudent);

// ✅ Delete classroom (teacher) - Must be before /:id route
router.delete("/:classId", authenticate, authorize(["teacher"]), deleteClass);

// ✅ Unified /my-classes route (teacher or student)
router.get("/my-classes", authenticate, async (req, res, next) => {
  try {
    if (req.user.role === "teacher") {
      return getMyClasses(req, res, next);
    } else if (req.user.role === "student") {
      return getStudentClasses(req, res, next);
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }
  } catch (error) {
    console.error("Error in unified /my-classes:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Student: get current class
router.get("/my-class", authenticate, authorize(["student"]), getStudentClass);

// ✅ Leaderboard
router.get("/:classId/leaderboard", authenticate, authorize(["teacher", "student"]), getLeaderboard);

// ⚠️ MUST BE LAST — this matches /:id so it can’t be above /my-classes
router.get("/:id", authenticate, getClassDetails);

module.exports = router;

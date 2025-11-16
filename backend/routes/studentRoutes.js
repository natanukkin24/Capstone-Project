// routes/studentRoutes.js
const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth");
const {
  getStudentsByClass,
  getStudentProfile,
  updateStudentProfile,
} = require("../controllers/studentController");

// Example routes
router.get(
  "/class/:classId",
  authenticate,
  authorize(["teacher"]), // restrict to teachers
  getStudentsByClass
);
router.get("/:id", getStudentProfile);
router.put("/:id", updateStudentProfile);

module.exports = router;

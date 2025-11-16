const express = require("express");
const router = express.Router();
const { createQuiz, updateQuizMap, getMyQuizzes, deleteQuiz } = require("../controllers/quizController");
const {
  getAvailableQuizzes,
  joinLobby,
  getLobbyPlayers,
  leaveLobby,
  getQuizLobby,
  teacherLeaveLobby,
} = require("../controllers/lobbyController");
const { authenticate, authorize } = require("../middleware/auth");

// Quiz routes
router.post("/create", authenticate, authorize(["teacher"]), createQuiz);
router.get("/my-quizzes", authenticate, authorize(["teacher"]), getMyQuizzes);

// Lobby routes (must be before /:quizId routes)
router.get("/available/:classId", authenticate, authorize(["student"]), getAvailableQuizzes);
router.post("/:quizId/join", authenticate, authorize(["student"]), joinLobby);
router.get("/:quizId/lobby", authenticate, getLobbyPlayers);
router.post("/:quizId/leave", authenticate, authorize(["student"]), leaveLobby);
router.post("/:quizId/teacher-leave", authenticate, authorize(["teacher"]), teacherLeaveLobby);
router.get("/:quizId/lobby-details", authenticate, authorize(["teacher"]), getQuizLobby);

// Quiz update routes (must be after lobby routes)
router.put("/:quizId/set-map", authenticate, authorize(["teacher"]), updateQuizMap);
router.delete("/:quizId", authenticate, authorize(["teacher"]), deleteQuiz);

module.exports = router;

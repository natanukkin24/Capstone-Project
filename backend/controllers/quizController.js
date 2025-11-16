// controllers/quizController.js
const Quiz = require("../models/Quiz");
const mongoose = require("mongoose");

exports.createQuiz = async (req, res) => {
  try {
    const { title, lessonReference, description, difficulty, mode, map, questions, classId } = req.body;
    const teacherId = req.user.id; // from authenticate middleware

    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: "Quiz title is required" });
    }
    if (!mode) {
      return res.status(400).json({ message: "Quiz mode is required" });
    }
    // Set default map if not provided (can be updated later)
    const selectedMap = map || "house";
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "At least one question is required" });
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText || q.questionText.trim() === "") {
        return res.status(400).json({ message: `Question ${i + 1}: Question text is required` });
      }
      if (!q.correctAnswer || q.correctAnswer.trim() === "") {
        return res.status(400).json({ message: `Question ${i + 1}: Correct answer is required` });
      }
      if (!q.questionType) {
        return res.status(400).json({ message: `Question ${i + 1}: Question type is required` });
      }
    }

    // Convert classId to ObjectId if provided
    let classIdObjectId = null;
    if (classId) {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ message: "Invalid classId format" });
      }
      classIdObjectId = new mongoose.Types.ObjectId(classId);
    }

    const newQuiz = new Quiz({
      title,
      lessonReference,
      description,
      difficulty: difficulty || "easy",
      mode,
      map: selectedMap,
      questions,
      createdBy: teacherId,
      classId: classIdObjectId,
    });

    await newQuiz.save();
    res.status(201).json({ message: "Quiz created successfully!", quiz: newQuiz });
  } catch (error) {
    console.error("Error creating quiz:", error);
    
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message).join(", ");
      return res.status(400).json({ message: `Validation error: ${errors}` });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ message: "A quiz with this title already exists" });
    }
    
    // Generic error
    res.status(500).json({ 
      message: "Failed to create quiz. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

exports.updateQuizMap = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { map } = req.body;
    const teacherId = req.user.id;

    if (!map) {
      return res.status(400).json({ message: "Map selection is required" });
    }

    // Validate map enum
    const validMaps = ["house", "lunar", "jungle"];
    if (!validMaps.includes(map)) {
      return res.status(400).json({ message: "Invalid map selection" });
    }

    // Validate quizId
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Verify the teacher owns this quiz
    if (quiz.createdBy.toString() !== teacherId) {
      return res.status(403).json({ message: "You don't have permission to update this quiz" });
    }

    quiz.map = map;
    await quiz.save();

    res.status(200).json({ message: "Map updated successfully!", quiz });
  } catch (error) {
    console.error("Error updating quiz map:", error);
    res.status(500).json({ 
      message: "Failed to update map. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

exports.getMyQuizzes = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const Lobby = require("../models/Lobby");

    // Fetch quizzes created by the teacher, populate classId to get subject
    const quizzes = await Quiz.find({ createdBy: teacherId })
      .populate("classId", "subject gradeLevel section")
      .sort({ createdAt: -1 }); // Most recent first

    // Get lobby status for each quiz
    const quizzesWithStatus = await Promise.all(
      quizzes.map(async (quiz) => {
        const lobby = await Lobby.findOne({ quizId: quiz._id });
        
        // For now, mark all quizzes as "waiting" since game is not implemented yet
        // TODO: Update this logic when game implementation is complete
        let quizStatus = "waiting"; // Default to waiting for now
        
        // Keep the lobby status check for future use when game is implemented
        // if (lobby) {
        //   if (lobby.status === "waiting") {
        //     quizStatus = "waiting";
        //   } else if (lobby.status === "starting" || lobby.status === "in_progress") {
        //     quizStatus = "pending";
        //   } else if (lobby.status === "completed") {
        //     quizStatus = "done";
        //   }
        // }

        return {
          ...quiz.toObject(),
          status: quizStatus,
          lobbyStatus: lobby ? lobby.status : null,
        };
      })
    );

    res.status(200).json(quizzesWithStatus);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ 
      message: "Failed to fetch quizzes. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Delete quiz (Teacher only)
exports.deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.user.id;
    const Lobby = require("../models/Lobby");

    if (!quizId) {
      return res.status(400).json({ message: "Quiz ID is required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID format" });
    }

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Check if user is the creator of this quiz
    if (quiz.createdBy.toString() !== teacherId) {
      return res.status(403).json({ message: "Forbidden: you are not the creator of this quiz" });
    }

    // Delete associated lobby if it exists
    await Lobby.deleteMany({ quizId: quizId });

    // Delete the quiz
    const deletedQuiz = await Quiz.findByIdAndDelete(quizId);

    if (!deletedQuiz) {
      return res.status(404).json({ message: "Quiz not found or already deleted" });
    }

    res.status(200).json({ 
      message: "Quiz deleted successfully",
      deletedQuiz: {
        id: deletedQuiz._id,
        title: deletedQuiz.title
      }
    });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({ 
      message: "Server error", 
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

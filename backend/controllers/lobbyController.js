// controllers/lobbyController.js
const Lobby = require("../models/Lobby");
const Quiz = require("../models/Quiz");
const Student = require("../models/Student");
const mongoose = require("mongoose");

// Get available quizzes for a class (for students)
exports.getAvailableQuizzes = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = req.user.id;

    if (!classId) {
      return res.status(400).json({ message: "Class ID is required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "Invalid class ID format" });
    }

    // Find all quizzes for this class
    const quizzes = await Quiz.find({ classId }).populate("createdBy", "firstname lastname");

    // Get all lobbies for these quizzes
    const quizIds = quizzes.map(q => q._id);
    const lobbies = await Lobby.find({ quizId: { $in: quizIds } }).populate("players.studentId", "firstname lastname username avatar");

    // Create a map of quizId to lobby
    const lobbyMap = {};
    lobbies.forEach(lobby => {
      lobbyMap[lobby.quizId.toString()] = lobby;
    });

    // Format response with lobby information
    const availableQuizzes = quizzes.map(quiz => {
      const lobby = lobbyMap[quiz._id.toString()];
      const isJoined = lobby && lobby.players.some(p => p.studentId._id.toString() === studentId);

      return {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        difficulty: quiz.difficulty,
        status: lobby ? lobby.status : "waiting",
        playerCount: lobby ? lobby.players.length : 0,
        isJoined: !!isJoined,
        map: quiz.map,
        mode: quiz.mode,
        createdAt: quiz.createdAt
      };
    });

    res.status(200).json({ quizzes: availableQuizzes });
  } catch (error) {
    console.error("Error fetching available quizzes:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Join lobby (for students)
exports.joinLobby = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.id;

    if (!quizId) {
      return res.status(400).json({ message: "Quiz ID is required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID format" });
    }

    // Find the quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Find or create lobby
    let lobby = await Lobby.findOne({ quizId });
    
    if (!lobby) {
      // Create new lobby
      lobby = new Lobby({
        quizId: quiz._id,
        classId: quiz.classId,
        players: [],
        status: "waiting"
      });
    }

    // Check if student is already in lobby
    const alreadyJoined = lobby.players.some(
      p => p.studentId.toString() === studentId
    );

    if (alreadyJoined) {
      // Update joinedAt timestamp to indicate they're still active
      const playerIndex = lobby.players.findIndex(
        p => p.studentId.toString() === studentId
      );
      if (playerIndex !== -1) {
        lobby.players[playerIndex].joinedAt = new Date();
        await lobby.save();
      }
      
      // Populate and return current lobby state
      await lobby.populate("players.studentId", "firstname lastname username avatar");
      return res.status(200).json({ 
        message: "Already in lobby",
        lobby: lobby
      });
    }

    // Check if lobby status allows joining (only allow if waiting)
    if (lobby.status !== "waiting") {
      return res.status(400).json({ 
        message: `Cannot join lobby. Game is ${lobby.status}.` 
      });
    }

    // Add student to lobby
    lobby.players.push({
      studentId: studentId,
      joinedAt: new Date()
    });

    await lobby.save();

    // Populate player data
    await lobby.populate("players.studentId", "firstname lastname username avatar");

    // Emit WebSocket event to notify all clients in the quiz room
    try {
      const serverModule = require('../server');
      const io = serverModule.io;
      if (io) {
        const studentData = await Student.findById(studentId).select("firstname lastname username avatar");
        io.to(`quiz-${quizId}`).emit('player-joined-lobby', {
          quizId: quizId.toString(),
          player: {
            id: studentId,
            _id: studentId,
            firstname: studentData?.firstname,
            lastname: studentData?.lastname,
            username: studentData?.username,
            avatar: studentData?.avatar
          },
          playerCount: lobby.players.length
        });
      }
    } catch (error) {
      console.error("Error emitting WebSocket event (player-joined-lobby):", error);
      // Continue even if WebSocket fails
    }

    res.status(200).json({ 
      message: "Joined lobby successfully",
      lobby: lobby
    });
  } catch (error) {
    console.error("Error joining lobby:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get lobby players (for students)
exports.getLobbyPlayers = async (req, res) => {
  try {
    const { quizId } = req.params;

    if (!quizId) {
      return res.status(400).json({ message: "Quiz ID is required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID format" });
    }

    const lobby = await Lobby.findOne({ quizId })
      .populate("players.studentId", "firstname lastname username avatar")
      .populate("quizId", "title description difficulty map mode");

    if (!lobby) {
      // Return quiz info even if lobby doesn't exist
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      return res.status(200).json({
        quiz: quiz,
        players: [],
        status: "waiting"
      });
    }

    // Filter out players with null studentId (in case of deleted students)
    const validPlayers = lobby.players.filter(p => p.studentId !== null);

    res.status(200).json({
      quiz: lobby.quizId,
      players: validPlayers.map(p => ({
        id: p.studentId._id,
        _id: p.studentId._id,
        firstname: p.studentId.firstname,
        lastname: p.studentId.lastname,
        username: p.studentId.username,
        avatar: p.studentId.avatar,
        joinedAt: p.joinedAt
      })),
      status: lobby.status
    });
  } catch (error) {
    console.error("Error fetching lobby players:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Leave lobby (for students)
exports.leaveLobby = async (req, res) => {
  try {
    const { quizId } = req.params;
    const studentId = req.user.id;

    if (!quizId) {
      return res.status(400).json({ message: "Quiz ID is required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(quizId)) {
      return res.status(400).json({ message: "Invalid quiz ID format" });
    }

    const lobby = await Lobby.findOne({ quizId });

    if (!lobby) {
      return res.status(404).json({ message: "Lobby not found" });
    }

    // Remove student from lobby
    lobby.players = lobby.players.filter(
      (p) => p.studentId.toString() !== studentId
    );

    // If no players left, delete the lobby
    if (lobby.players.length === 0) {
      await Lobby.findByIdAndDelete(lobby._id);
      
      // Emit WebSocket event
      try {
        const serverModule = require('../server');
        const io = serverModule.io;
        if (io) {
          io.to(`quiz-${quizId}`).emit('player-left-lobby', {
            quizId: quizId.toString(),
            studentId: studentId.toString(),
            playerCount: 0
          });
        }
      } catch (error) {
        console.error("Error emitting WebSocket event (player-left-lobby):", error);
        // Continue even if WebSocket fails
      }
      
      return res.status(200).json({ message: "Left lobby successfully" });
    }

    await lobby.save();
    
    // Emit WebSocket event to notify all clients
    try {
      const serverModule = require('../server');
      const io = serverModule.io;
      if (io) {
        io.to(`quiz-${quizId}`).emit('player-left-lobby', {
          quizId: quizId.toString(),
          studentId: studentId.toString(),
          playerCount: lobby.players.length
        });
      }
    } catch (error) {
      console.error("Error emitting WebSocket event (player-left-lobby):", error);
      // Continue even if WebSocket fails
    }
    
    res.status(200).json({ message: "Left lobby successfully" });
  } catch (error) {
    console.error("Error leaving lobby:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Teacher leaves lobby (deletes entire lobby)
exports.teacherLeaveLobby = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.user.id;

    if (req.user.role !== "teacher") {
      return res.status(403).json({ message: "Only teachers can use this endpoint" });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Verify teacher owns this quiz
    if (quiz.createdBy.toString() !== teacherId) {
      return res.status(403).json({ message: "You don't have permission to close this lobby" });
    }

    // Delete the entire lobby
    const lobby = await Lobby.findOneAndDelete({ quizId });

    res.status(200).json({ 
      message: "Lobby closed successfully",
      classId: quiz.classId ? quiz.classId.toString() : null
    });
  } catch (error) {
    console.error("Error closing lobby:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get quiz details for lobby (for teacher)
exports.getQuizLobby = async (req, res) => {
  try {
    const { quizId } = req.params;
    const teacherId = req.user.id;

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

    // Verify teacher owns this quiz
    if (quiz.createdBy.toString() !== teacherId) {
      return res.status(403).json({ message: "You don't have permission to view this lobby" });
    }

    const lobby = await Lobby.findOne({ quizId })
      .populate("players.studentId", "firstname lastname username avatar");

    if (!lobby) {
      return res.status(200).json({
        quiz: quiz,
        players: [],
        status: "waiting"
      });
    }

    // Filter out players with null studentId (in case of deleted students)
    const validPlayers = lobby.players.filter(p => p.studentId !== null);

    res.status(200).json({
      quiz: quiz,
      players: validPlayers.map(p => ({
        id: p.studentId._id,
        _id: p.studentId._id,
        firstname: p.studentId.firstname,
        lastname: p.studentId.lastname,
        username: p.studentId.username,
        avatar: p.studentId.avatar,
        joinedAt: p.joinedAt
      })),
      status: lobby.status
    });
  } catch (error) {
    console.error("Error fetching quiz lobby:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

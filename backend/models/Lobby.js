// models/Lobby.js
const mongoose = require("mongoose");

const lobbySchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
    unique: true,
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class",
    required: true,
  },
  players: [
    {
      studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true,
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  status: {
    type: String,
    enum: ["waiting", "starting", "in_progress", "completed"],
    default: "waiting",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  startedAt: {
    type: Date,
  },
});

module.exports = mongoose.model("Lobby", lobbySchema);





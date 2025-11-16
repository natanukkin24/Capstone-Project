// models/Quiz.js
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionType: {
    type: String,
    enum: ["multiple_choice", "true_false", "fill_in_the_blank"],
    required: true,
  },
  questionText: { type: String, required: true },
  options: [{ type: String }], // For MCQ
  correctAnswer: { type: String, required: true },
  exp: { type: Number, default: 10 },
  points: { type: Number, default: 20 },
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  lessonReference: { type: String },
  description: { type: String },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "easy",
  },
  mode: {
    type: String,
    enum: ["singleplayer", "multiplayer"],
    required: true,
  },
  map: {
    type: String,
    enum: ["house", "lunar", "jungle"],
    required: true,
  },
  questions: [questionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
}, { timestamps: true });

module.exports = mongoose.model("Quiz", quizSchema);

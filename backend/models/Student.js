const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstname: { type: String, required: true },
  lastname:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  birthMonth: { type: String, required: true },
  birthDay: { type: String, required: true },
  birthYear: { type: String, required: true },
  gender: { type: String, required: true },
  section: { type: String, required: true },
  gradeLevel: { type: String, required: true },
  accountType: { type: String },
  avatar: { type: String, default: "" },
  points: { type: Number, default: 0 },


  classrooms: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
  ],


  // 🎮 Gamification stats
  points: { type: Number, default: 0 },
  exp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  badges: [
    {
      name: String,
      description: String,
      icon: String,
      earnedAt: { type: Date, default: Date.now },
    },
  ],

}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);

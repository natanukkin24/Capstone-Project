const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  gradeLevel: { type: String, required: true },
  section: { type: String, required: true },
  subject: { type: String, required: true },
  classCode: { type: String, unique: true, required: true }, 
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    required: true,
  },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Class", classSchema);

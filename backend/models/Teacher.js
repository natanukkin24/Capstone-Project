// models/Student.js
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
  accountType: { type: String},
  avatar: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', studentSchema);

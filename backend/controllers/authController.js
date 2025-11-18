const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Admin = require("../models/Admin");

// REGISTER
const register = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      birthMonth,
      birthDay,
      birthYear,
      gradeLevel,
      section,
      gender,
      email,
      password,
      accountType, // "student", "teacher", or "admin"
    } = req.body;

    if (!firstname || !lastname || !email || !password || !accountType) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const normalizedType = accountType.toLowerCase();
    const accountTypeMap = {
      student: Student,
      teacher: Teacher,
      admin: Admin,
    };

    if (!accountTypeMap[normalizedType]) {
      return res.status(400).json({ message: "Invalid account type" });
    }

    const existingStudent = await Student.findOne({ email });
    const existingTeacher = await Teacher.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });
    if (existingStudent || existingTeacher || existingAdmin) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const Model = accountTypeMap[normalizedType];
    const userPayload = {
      firstname,
      lastname,
      birthMonth,
      birthDay,
      birthYear,
      gender,
      email,
      password: hashedPassword,
      accountType: normalizedType,
    };

    if (normalizedType === "student") {
      userPayload.gradeLevel = gradeLevel;
      userPayload.section = section;
    }

    const newUser = new Model(userPayload);

    await newUser.save();

    res.status(201).json({
      message: `${normalizedType} registered successfully`,
      user: newUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    let user =
      (await Student.findOne({ email })) ||
      (await Teacher.findOne({ email })) ||
      (await Admin.findOne({ email }));

    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.accountType },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstname,
        lastName: user.lastname,
        email: user.email,
        role: user.accountType, // 👈 match frontend
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { register, login };

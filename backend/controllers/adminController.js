const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Admin = require('../models/Admin');

exports.createTeacher = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      password,
      birthMonth,
      birthDay,
      birthYear,
      gender,
    } = req.body;

    if (
      !firstname ||
      !lastname ||
      !email ||
      !password ||
      !birthMonth ||
      !birthDay ||
      !birthYear ||
      !gender
    ) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser =
      (await Teacher.findOne({ email })) ||
      (await Student.findOne({ email })) ||
      (await Admin.findOne({ email }));

    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = new Teacher({
      firstname,
      lastname,
      email,
      password: hashedPassword,
      birthMonth,
      birthDay,
      birthYear,
      gender,
      accountType: 'teacher',
    });

    await teacher.save();

    res.status(201).json({
      message: 'Teacher created successfully',
      teacher: {
        id: teacher._id,
        firstname: teacher.firstname,
        lastname: teacher.lastname,
        email: teacher.email,
      },
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// GET profile (based on logged-in user)
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const Model = role === 'student' ? Student : Teacher;
    const user = await Model.findById(userId).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const Model = role === 'student' ? Student : Teacher;

    // Get allowed fields
    const { firstName, lastName, gender, gradeLevel, username, avatar, section } = req.body;

    console.log('Update profile request:', { userId, role, body: req.body });

    const updateFields = {};
    
    // Always update these fields if provided (they exist in both Student and Teacher models)
    if (firstName !== undefined && firstName !== null && firstName !== '') updateFields.firstname = firstName;
    if (lastName !== undefined && lastName !== null && lastName !== '') updateFields.lastname = lastName;
    if (gender !== undefined && gender !== null && gender !== '') updateFields.gender = gender;
    if (avatar !== undefined && avatar !== null && avatar !== '') updateFields.avatar = avatar;
    
    // Student-specific fields
    if (role === 'student') {
      if (gradeLevel !== undefined && gradeLevel !== null && gradeLevel !== '') updateFields.gradeLevel = gradeLevel;
      if (section !== undefined && section !== null && section !== '') updateFields.section = section;
      // Note: username field doesn't exist in Student model, so we skip it
    }
    
    // Teacher-specific fields (if any)
    if (role === 'teacher') {
      // Add teacher-specific fields here if needed
    }

    console.log('Update fields:', updateFields);

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const updatedUser = await Model.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

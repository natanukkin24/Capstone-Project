// routes/teacherRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const teacherController = require('../controllers/teacherController');

router.get('/my-classes', authenticate, authorize(['teacher']), teacherController.getMyClasses);

module.exports = router;
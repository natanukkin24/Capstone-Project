const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { createTeacher } = require('../controllers/adminController');

router.post('/teachers', authenticate, authorize(['admin']), createTeacher);

module.exports = router;


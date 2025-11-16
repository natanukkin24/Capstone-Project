const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getProfile, updateProfile } = require('../controllers/profileController');

router.get('/', authenticate, getProfile);
router.put('/', authenticate, updateProfile);

module.exports = router;

// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');  // Import protect middleware
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');

// Public routes (tidak perlu login)
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);

module.exports = router;
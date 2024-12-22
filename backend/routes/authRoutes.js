// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');  // Import protect middleware
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin, validatePasswordReset } = require('../middleware/validation');

// Public routes (tidak perlu login)
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-token/:token', authController.verifyResetToken);

// Protected route (perlu login)
router.post('/reset-password', protect, validatePasswordReset, authController.resetPassword);

module.exports = router;
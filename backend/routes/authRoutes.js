const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const AuthController = require('../controllers/authController');
const { validateRegistration, validateLogin, validatePasswordReset } = require('../middleware/validation');

// Public routes
router.post('/register', validateRegistration, AuthController.register);
router.post('/login', validateLogin, AuthController.login);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password/:token', validatePasswordReset, AuthController.resetPassword);

// Protected routes
router.use(protect);

router.get('/profile', AuthController.getProfile);
router.put('/profile', AuthController.updateProfile);
router.post('/change-password', validatePasswordReset, AuthController.changePassword);

module.exports = router;
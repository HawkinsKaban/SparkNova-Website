// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { protect } = require('../middleware/auth');

// Make sure the handlers are properly imported and defined
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);
router.get('/detail/:email', protect, authController.getUserByEmail);

module.exports = router;
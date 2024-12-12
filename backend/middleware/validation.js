// middleware/validation.js
const { check } = require('express-validator');

exports.validateRegistration = [
  check('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long'),
  check('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

exports.validateLogin = [
  check('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  check('password')
    .not()
    .isEmpty()
    .withMessage('Password is required')
];
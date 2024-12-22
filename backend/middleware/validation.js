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

exports.validatePasswordReset = [
  check('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  check('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('New password must contain at least one number')
    .matches(/[A-Z]/)
    .withMessage('New password must contain at least one uppercase letter')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  
  check('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];
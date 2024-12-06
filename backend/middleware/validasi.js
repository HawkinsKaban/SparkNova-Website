const { check } = require('express-validator');

exports.validasiRegistrasi = [
  check('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username minimal 3 karakter'),
  check('email')
    .isEmail()
    .withMessage('Email tidak valid'),
  check('password')
    .isLength({ min: 6 })
    .withMessage('Password minimal 6 karakter')
];

exports.validasiLogin = [
  check('email')
    .isEmail()
    .withMessage('Email tidak valid'),
  check('password')
    .exists()
    .withMessage('Password diperlukan')
];

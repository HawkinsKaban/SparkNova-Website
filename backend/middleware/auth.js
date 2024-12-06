// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/Pengguna');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Akses ditolak. Login diperlukan'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (err) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Token tidak valid'
      });
    }
  } catch (error) {
    return res.status(500).json({
      sukses: false,
      pesan: 'Server Error'
    });
  }
};

// middleware/validasi.js
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

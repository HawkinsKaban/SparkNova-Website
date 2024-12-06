// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { validasiRegistrasi, validasiLogin } = require('../middleware/validasi');

router.post('/register', validasiRegistrasi, register);
router.post('/login', validasiLogin, login);

module.exports = router;
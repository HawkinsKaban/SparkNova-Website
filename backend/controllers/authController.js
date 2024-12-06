const { Pengguna } = require('../models');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Cek apakah username atau email sudah terdaftar
    const penggunaExists = await Pengguna.findOne({ 
      $or: [
        { namaUser: username }, 
        { email: email.toLowerCase() }
      ] 
    });

    if (penggunaExists) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Username atau email sudah terdaftar'
      });
    }

    // Buat pengguna baru
    const pengguna = await Pengguna.create({
      namaUser: username,
      email: email.toLowerCase(),
      kataSandi: password
    });

    // Generate token
    const token = generateToken(pengguna._id);

    res.status(201).json({
      sukses: true,
      token,
      pengguna: {
        id: pengguna._id,
        username: pengguna.namaUser,
        email: pengguna.email,
        peran: pengguna.peran
      }
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      sukses: false,
      pesan: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cari pengguna berdasarkan email
    const pengguna = await Pengguna.findOne({ email: email.toLowerCase() });
    if (!pengguna) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Email atau kata sandi salah'
      });
    }

    // Verifikasi kata sandi
    const isMatch = await pengguna.cocokkanKataSandi(password);
    if (!isMatch) {
      return res.status(401).json({
        sukses: false,
        pesan: 'Email atau kata sandi salah'
      });
    }

    // Generate token
    const token = generateToken(pengguna._id);

    res.json({
      sukses: true,
      token,
      pengguna: {
        id: pengguna._id,
        username: pengguna.namaUser,
        email: pengguna.email,
        peran: pengguna.peran
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      sukses: false,
      pesan: error.message
    });
  }
};
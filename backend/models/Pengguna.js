// models/Pengguna.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const penggunaSchema = new mongoose.Schema({
  namaUser: {
    type: String,
    required: [true, 'Nama pengguna wajib diisi'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true,
    trim: true,
    lowercase: true
  },
  kataSandi: {
    type: String,
    required: [true, 'Kata sandi wajib diisi'],
    minlength: [6, 'Kata sandi minimal 6 karakter']
  },
  peran: {
    type: String,
    enum: ['pengguna', 'admin'],
    default: 'pengguna'
  }
}, { timestamps: true });

penggunaSchema.pre('save', async function(next) {
  if (!this.isModified('kataSandi')) return next();
  this.kataSandi = await bcrypt.hash(this.kataSandi, 12);
  next();
});

penggunaSchema.methods.cocokkanKataSandi = async function(kataSandiMasuk) {
  return await bcrypt.compare(kataSandiMasuk, this.kataSandi);
};

module.exports = mongoose.model('Pengguna', penggunaSchema);
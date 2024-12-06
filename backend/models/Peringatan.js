const mongoose = require('mongoose');

const peringatanSchema = new mongoose.Schema({
  idPerangkat: {
    type: String,
    ref: 'Perangkat',
    required: true
  },
  jenis: {
    type: String,
    enum: ['peringatan', 'kritis'],
    required: true
  },
  pesan: {
    type: String,
    required: true
  },
  statusAktif: {
    type: Boolean,
    default: true
  },
  waktuPenyelesaian: Date
}, {
  timestamps: true,
  indexes: [{ idPerangkat: 1, statusAktif: 1 }]
});

module.exports = mongoose.model('Peringatan', peringatanSchema);
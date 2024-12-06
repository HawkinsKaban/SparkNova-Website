const mongoose = require('mongoose');

const pembacaanEnergiSchema = new mongoose.Schema({
  idPerangkat: {
    type: String,
    ref: 'Perangkat',
    required: true
  },
  tegangan: {
    type: Number,
    required: true
  },
  arus: {
    type: Number,
    required: true
  },
  daya: {
    type: Number,
    required: true
  },
  energi: {
    type: Number,
    required: true
  },
  frekuensi: Number,
  faktorDaya: Number,
  waktuPembacaan: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  indexes: [{ idPerangkat: 1, waktuPembacaan: 1 }]
});

module.exports = mongoose.model('PembacaanEnergi', pembacaanEnergiSchema);
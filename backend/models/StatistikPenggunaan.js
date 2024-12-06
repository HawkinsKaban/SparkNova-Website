const mongoose = require('mongoose');

const statistikPenggunaanSchema = new mongoose.Schema({
  idPerangkat: {
    type: String,
    ref: 'Perangkat',
    required: true
  },
  periode: {
    type: String,
    enum: ['harian', 'mingguan', 'bulanan'],
    required: true
  },
  waktuMulai: {
    type: Date,
    required: true
  },
  waktuSelesai: {
    type: Date,
    required: true
  },
  totalKwh: {
    type: Number,
    required: true
  },
  ratarataDaya: {
    type: Number,
    required: true
  },
  dayaMaksimum: {
    type: Number,
    required: true
  },
  dayaMinimum: {
    type: Number,
    required: true
  },
  biayaDasar: {
    type: Number,
    required: true
  },
  biayaPPJ: {
    type: Number,
    required: true
  },
  totalBiaya: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  indexes: [{ idPerangkat: 1, periode: 1, waktuMulai: 1 }]
});

module.exports = mongoose.model('StatistikPenggunaan', statistikPenggunaanSchema);
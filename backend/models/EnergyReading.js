// models/EnergyReading.js
const mongoose = require('mongoose');

const energyReadingSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    ref: 'Device',
    required: true
  },
  voltage: {
    type: Number,
    required: true
  },
  current: {
    type: Number,
    required: true
  },
  power: {
    type: Number,
    required: true
  },
  energy: {
    type: Number,
    required: true
  },
  frequency: Number,
  powerFactor: Number,
  readingTime: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false,
  indexes: [{ deviceId: 1, readingTime: 1 }]
});

module.exports = mongoose.model('EnergyReading', energyReadingSchema);

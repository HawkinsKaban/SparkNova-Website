// models/Alert.js
const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    ref: 'Device',
    required: true
  },
  type: {
    type: String,
    enum: ['warning', 'critical'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resolvedAt: Date
}, {
  timestamps: true,
  indexes: [{ deviceId: 1, isActive: 1 }]
});

module.exports = mongoose.model('Alert', alertSchema);
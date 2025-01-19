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
  timestamps: true
});

// Single compound index for common queries
alertSchema.index({ deviceId: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
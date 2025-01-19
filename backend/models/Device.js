const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'configuring'],
    default: 'disconnected'
  },
  relayState: {
    type: Boolean,
    default: false
  },
  lastConnection: Date,
  firmware: {
    version: String,
    lastUpdate: Date
  },
  hardware: {
    esp32Version: String,
    arduinoVersion: String
  },
  config: {
    powerLimit: {
      type: Number,
      default: 2200
    },
    currentLimit: {
      type: Number,
      default: 10
    },
    warningThreshold: {
      type: Number,
      default: 90
    }
  }
}, { timestamps: true });

// Indexes for efficient queries
deviceSchema.index({ userId: 1, status: 1 });
deviceSchema.index({ deviceId: 1, lastConnection: 1 });

module.exports = mongoose.model('Device', deviceSchema);
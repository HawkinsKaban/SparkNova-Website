// models/Device.js
const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  wifiSSID: String,
  wifiPassword: String,
  lastConnection: Date,
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'configuring'],
    default: 'disconnected'
  },
  relayState: {
    type: Boolean,
    default: false
  },
  thresholds: {
    warning: {
      type: Number,
      default: 800
    },
    critical: {
      type: Number,
      default: 1000
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);
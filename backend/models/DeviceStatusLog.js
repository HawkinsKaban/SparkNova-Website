const mongoose = require('mongoose');

const deviceStatusLogSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    ref: 'Device',
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected'],
    required: true
  },
  reason: {
    type: String,
    enum: ['manual', 'timeout', 'error', 'startup', 'shutdown'],
    required: true
  },
  details: {
    errorCode: Number,
    message: String,
    rssi: Number,        // WiFi signal strength
    voltage: Number,     // Power status
    metadata: Object     // Additional data
  }
}, {
  timestamps: false,
  timeseries: {
    timeField: 'timestamp',
    metaField: 'deviceId',
    granularity: 'minutes'
  }
});

// Indexes for efficient queries
deviceStatusLogSchema.index({ deviceId: 1, timestamp: -1 });
deviceStatusLogSchema.index({ status: 1, timestamp: -1 });

module.exports = mongoose.model('DeviceStatusLog', deviceStatusLogSchema);
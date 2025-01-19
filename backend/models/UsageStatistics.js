const mongoose = require('mongoose');

const usageStatisticsSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    ref: 'Device',
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  totalKwh: {
    type: Number,
    required: true,
    min: 0
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Single compound index for querying statistics
usageStatisticsSchema.index({ deviceId: 1, period: 1, startTime: -1 });

module.exports = mongoose.model('UsageStatistics', usageStatisticsSchema);
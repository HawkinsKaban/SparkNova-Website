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
    required: true
  },
  averagePower: {
    type: Number,
    required: true
  },
  maxPower: {
    type: Number,
    required: true
  },
  minPower: {
    type: Number,
    required: true
  },
  baseCost: {
    type: Number,
    required: true
  },
  taxCost: {
    type: Number,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  }
}, {
  timestamps: true,
  indexes: [{ deviceId: 1, period: 1, startTime: 1 }]
});

module.exports = mongoose.model('UsageStatistics', usageStatisticsSchema);
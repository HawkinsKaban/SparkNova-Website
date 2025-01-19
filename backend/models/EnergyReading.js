const mongoose = require('mongoose');

const energyReadingSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    ref: 'Device',
    required: true
  },
  voltage: {
    type: Number,
    required: true,
    min: 0,
    max: 500
  },
  current: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  power: {
    type: Number,
    required: true,
    min: 0
  },
  energy: {
    type: Number,
    required: true,
    min: 0
  },
  frequency: {
    type: Number,
    min: 45,
    max: 65,
    default: null
  },
  powerFactor: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  powerConnected: {
    type: Boolean,
    default: true
  },
  readingTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  errorCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: false,
  toJSON: {
    transform: function(doc, ret) {
      if (ret.voltage) ret.voltage = Number(ret.voltage.toFixed(1));
      if (ret.current) ret.current = Number(ret.current.toFixed(2));
      if (ret.power) ret.power = Number(ret.power.toFixed(2));
      if (ret.energy) ret.energy = Number(ret.energy.toFixed(3));
      if (ret.frequency) ret.frequency = Number(ret.frequency.toFixed(1));
      if (ret.powerFactor) ret.powerFactor = Number(ret.powerFactor.toFixed(2));
      return ret;
    }
  }
});

// Indexes
energyReadingSchema.index({ deviceId: 1, readingTime: -1 });
energyReadingSchema.index({ deviceId: 1, power: 1 });
energyReadingSchema.index({ readingTime: 1, powerConnected: 1 });

// Pre-save hook untuk validasi
energyReadingSchema.pre('save', function(next) {
  if (!this.powerConnected) {
    this.voltage = 0;
    this.current = 0;
    this.power = 0;
    this.frequency = null;
    this.powerFactor = null;
  }
  next();
});

// Virtual untuk apparent power (VA)
energyReadingSchema.virtual('apparentPower').get(function() {
  return this.voltage * this.current;
});

// Methods
energyReadingSchema.methods.getVoltageStatus = function() {
  if (this.voltage < 190) return 'low';
  if (this.voltage > 250) return 'high';
  return 'normal';
};

energyReadingSchema.methods.getPowerFactorStatus = function() {
  if (!this.powerFactor) return 'unknown';
  if (this.powerFactor < 0.85) return 'low';
  return 'normal';
};

module.exports = mongoose.model('EnergyReading', energyReadingSchema);
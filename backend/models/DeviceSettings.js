// models/DeviceSettings.js
const mongoose = require('mongoose');

const deviceSettingsSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        ref: 'Device',
        required: true,
        unique: true
    },
    serviceType: {
        type: String,
        enum: ['R1_900VA', 'R1_1300VA', 'R1_2200VA', 'R2_3500VA', 'R3_6600VA'],
        default: 'R1_900VA'
    },
    powerLimit: {
        type: Number,
        default: 1000.00
    },
    warningPercentage: {
        type: Number,
        default: 80.00
    },
    taxRate: {
        type: Number,
        default: 5.00
    },
    wifiSSID: String,
    wifiPassword: String
}, {
    timestamps: true
});

module.exports = mongoose.model('DeviceSettings', deviceSettingsSchema);

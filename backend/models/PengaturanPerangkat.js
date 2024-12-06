const mongoose = require('mongoose');

const pengaturanPerangkatSchema = new mongoose.Schema({
    idPerangkat: {
        type: String,
        ref: 'Perangkat',
        required: true,
        unique: true
    },
    jenisLayanan: {
        type: String,
        enum: ['R1_900VA', 'R1_1300VA', 'R1_2200VA', 'R2_3500VA', 'R3_6600VA'],
        default: 'R1_900VA'
    },
    batasDaya: {
        type: Number,
        default: 1000.00
    },
    persentasePeringatan: {
        type: Number,
        default: 80.00
    },
    tarifPPJ: {
        type: Number,
        default: 5.00
    },
    wifiSSID: String,
    wifiPassword: String
}, {
    timestamps: true
});

module.exports = mongoose.model('PengaturanPerangkat', pengaturanPerangkatSchema);
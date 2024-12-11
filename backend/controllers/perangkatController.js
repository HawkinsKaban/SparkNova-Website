// controllers/perangkatController.js
const { Perangkat, PengaturanPerangkat } = require('../models');

exports.daftarPerangkat = async (req, res) => {
  try {
    const { deviceId, nama, lokasi, jenisLayanan, wifiSSID, wifiPassword } = req.body;

    // Cek duplikat device ID
    const perangkatAda = await Perangkat.findOne({ deviceId });
    if (perangkatAda) {
      return res.status(400).json({
        sukses: false,
        pesan: 'ID Perangkat sudah terdaftar',
      });
    }

    // Buat perangkat baru
    const perangkat = await Perangkat.create({
      userId: req.user._id,
      deviceId,
      name: nama,
      lokasi,
      status: 'configuring',
    });

    // Buat pengaturan default
    await PengaturanPerangkat.create({
      idPerangkat: deviceId,
      jenisLayanan: jenisLayanan || 'R1_900VA',
      batasDaya: 1000.0,
      persentasePeringatan: 80.0,
      tarifPPJ: 5.0,
      wifiSSID,
      wifiPassword,
    });

    res.status(201).json({
      sukses: true,
      data: {
        ...perangkat.toJSON(),
        wifiSSID,
        jenisLayanan,
      },
    });
  } catch (error) {
    console.error('Daftar Perangkat Error:', error);
    res.status(500).json({
      sukses: false,
      pesan: error.message,
    });
  }
};

exports.ambilSemuaPerangkat = async (req, res) => {
  try {
    const perangkat = await Perangkat.find({ userId: req.user._id });
    res.json({
      sukses: true,
      data: perangkat,
    });
  } catch (error) {
    res.status(500).json({
      sukses: false,
      pesan: error.message,
    });
  }
};

exports.ambilPerangkat = async (req, res) => {
  try {
    const perangkat = await Perangkat.findOne({
      deviceId: req.params.deviceId,
      userId: req.user._id,            
    });

    if (!perangkat) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Perangkat tidak ditemukan',
      });
    }

    res.json({
      sukses: true,
      data: perangkat,
    });
  } catch (error) {
    res.status(500).json({
      sukses: false,
      pesan: error.message,
    });
  }
};

exports.updatePerangkat = async (req, res) => {
  try {
    const { nama, lokasi, status } = req.body;
    
    const perangkat = await Perangkat.findOneAndUpdate(
      { 
        deviceId: req.params.deviceId,
        userId: req.user._id
      },
      { nama, lokasi, status },
      { new: true }
    );

    if (!perangkat) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Perangkat tidak ditemukan',
      });
    }

    res.json({
      sukses: true,
      data: perangkat,
    });
  } catch (error) {
    res.status(500).json({
      sukses: false,
      pesan: error.message,
    });
  }
};

exports.updateStatusRelay = async (req, res) => {
  try {
    const { statusRelay } = req.body;
    
    const perangkat = await Perangkat.findOneAndUpdate(
      {
        deviceId: req.params.deviceId,
        userId: req.user._id
      },
      { statusRelay },
      { new: true }
    );

    if (!perangkat) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Perangkat tidak ditemukan'
      });
    }

    res.json({
      sukses: true,
      data: perangkat
    });
  } catch (error) {
    res.status(500).json({
      sukses: false,
      pesan: error.message
    });
  }
};

exports.hapusPerangkat = async (req, res) => {
  try {
    const perangkat = await Perangkat.findOneAndDelete({
      deviceId: req.params.deviceId,
      userId: req.user._id
    });

    if (!perangkat) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Perangkat tidak ditemukan'
      });
    }

    // Hapus pengaturan terkait
    await PengaturanPerangkat.deleteOne({ idPerangkat: req.params.deviceId });

    res.json({
      sukses: true,
      pesan: 'Perangkat berhasil dihapus'
    });
  } catch (error) {
    res.status(500).json({
      sukses: false,
      pesan: error.message
    });
  }
};
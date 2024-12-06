// controllers/perangkatController.js
const { Perangkat, PengaturanPerangkat } = require('../models');

exports.daftarPerangkat = async (req, res) => {
  try {
    const { idPerangkat, nama, lokasi, jenisLayanan, wifiSSID, wifiPassword } = req.body;
    
    // Cek apakah perangkat sudah terdaftar
    const perangkatAda = await Perangkat.findOne({ idPerangkat });
    if (perangkatAda) {
      return res.status(400).json({
        sukses: false,
        pesan: 'ID Perangkat sudah terdaftar'
      });
    }

    // Buat perangkat baru
    const perangkat = await Perangkat.create({
      idPengguna: req.user._id,
      idPerangkat,
      nama,
      lokasi,
      statusKoneksi: 'konfigurasi'  // Set status awal ke konfigurasi
    });

    // Buat pengaturan default dengan konfigurasi WiFi
    await PengaturanPerangkat.create({
      idPerangkat: perangkat.idPerangkat,
      jenisLayanan: jenisLayanan || 'R1_900VA',
      batasDaya: 1000.00,
      persentasePeringatan: 80.00,
      tarifPPJ: 5.00,
      wifiSSID,
      wifiPassword
    });

    // Response tanpa menampilkan password WiFi
    res.status(201).json({
      sukses: true,
      data: {
        ...perangkat.toJSON(),
        wifiSSID,
        jenisLayanan
      }
    });
  } catch (error) {
    console.error('Daftar Perangkat Error:', error);
    res.status(500).json({
      sukses: false,
      pesan: error.message
    });
  }
};

exports.ambilSemuaPerangkat = async (req, res) => {
  try {
    const perangkat = await Perangkat.find({ idPengguna: req.user._id });
    
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

exports.ambilPerangkat = async (req, res) => {
  try {
    const perangkat = await Perangkat.findOne({
      idPerangkat: req.params.idPerangkat,
      idPengguna: req.user._id
    });

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

exports.updatePerangkat = async (req, res) => {
  try {
    const { nama, lokasi } = req.body;
    
    const perangkat = await Perangkat.findOneAndUpdate(
      { 
        idPerangkat: req.params.idPerangkat,
        idPengguna: req.user._id
      },
      { nama, lokasi },
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

exports.updateStatusRelay = async (req, res) => {
  try {
    const { statusRelay } = req.body;
    
    const perangkat = await Perangkat.findOneAndUpdate(
      {
        idPerangkat: req.params.idPerangkat,
        idPengguna: req.user._id
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
      idPerangkat: req.params.idPerangkat,
      idPengguna: req.user._id
    });

    if (!perangkat) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Perangkat tidak ditemukan'
      });
    }

    // Hapus pengaturan terkait
    await PengaturanPerangkat.deleteOne({ idPerangkat: req.params.idPerangkat });

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
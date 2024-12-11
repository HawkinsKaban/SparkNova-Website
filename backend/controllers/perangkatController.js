// controllers/perangkatController.js
const { Perangkat, PengaturanPerangkat } = require('../models');

exports.daftarPerangkat = async (req, res) => {
  try {
    const { idPerangkat, nama, lokasi, jenisLayanan, wifiSSID, wifiPassword } = req.body;

    // Cek apakah perangkat sudah terdaftar
    const perangkatAda = await Perangkat.findOne({ deviceId: idPerangkat });
    if (perangkatAda) {
      return res.status(400).json({
        sukses: false,
        pesan: 'ID Perangkat sudah terdaftar',
      });
    }

    // Buat perangkat baru dengan userId dari token
    const perangkat = await Perangkat.create({
      userId: req.user._id, // Otomatis diambil dari token
      deviceId: idPerangkat,
      name: nama,
      lokasi,
      status: 'configuring', // Status awal
    });

    // Buat pengaturan perangkat default
    await PengaturanPerangkat.create({
      idPerangkat: perangkat.deviceId,
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
    console.log('User ID:', req.user._id); // Log user ID
    const perangkat = await Perangkat.find({ userId: req.user._id });
    console.log('Hasil Query:', perangkat); // Log hasil query

    res.json({
      sukses: true,
      data: perangkat,
    });
  } catch (error) {
    console.error('Error Mengambil Perangkat:', error);
    res.status(500).json({
      sukses: false,
      pesan: error.message,
    });
  }
};

exports.ambilPerangkat = async (req, res) => {
  try {
    const perangkat = await Perangkat.findOne({
      deviceId: req.params.idPerangkat, // Ubah ke deviceId
      userId: req.user._id,            // Ubah ke userId
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
    console.error('Error Mengambil Perangkat:', error);
    res.status(500).json({
      sukses: false,
      pesan: error.message,
    });
  }
};


exports.updatePerangkat = async (req, res) => {
  try {
    const { nama, lokasi } = req.body;

    // Log untuk debug
    console.log('ID Perangkat:', req.params.idPerangkat);
    console.log('User ID:', req.user._id);

    const perangkat = await Perangkat.findOneAndUpdate(
      { 
        deviceId: req.params.idPerangkat, // Gunakan deviceId
        userId: req.user._id             // Gunakan userId
      },
      { nama, lokasi },
      { new: true } // Mengembalikan data yang telah diperbarui
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
    console.error('Error Update Perangkat:', error);
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
        deviceId: req.params.idPerangkat,
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
      deviceId: req.params.idPerangkat,
      userId: req.user._id
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
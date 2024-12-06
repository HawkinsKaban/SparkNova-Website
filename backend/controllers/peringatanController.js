const { Peringatan, Perangkat } = require('../models');
const mongoose = require('mongoose');

exports.ambilPeringatan = async (req, res) => {
  try {
    const { idPerangkat } = req.params;
    const { statusAktif } = req.query;

    const perangkat = await Perangkat.findOne({
      idPerangkat,
      idPengguna: req.user._id
    });

    if (!perangkat) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Perangkat tidak ditemukan'
      });
    }

    const query = { idPerangkat };
    if (statusAktif !== undefined) {
      query.statusAktif = statusAktif === 'true';
    }

    const peringatan = await Peringatan.find(query)
      .sort({ createdAt: -1 });

    res.json({
      sukses: true,
      data: peringatan
    });
  } catch (error) {
    res.status(500).json({
      sukses: false,
      pesan: error.message
    });
  }
};

exports.selesaikanPeringatan = async (req, res) => {
  try {
    const { idPeringatan } = req.params;

    // Validasi format ObjectId
    if (!mongoose.Types.ObjectId.isValid(idPeringatan)) {
      return res.status(400).json({
        sukses: false,
        pesan: 'Format ID peringatan tidak valid'
      });
    }

    // Cari peringatan
    const peringatan = await Peringatan.findById(idPeringatan);
    
    if (!peringatan) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Peringatan tidak ditemukan'
      });
    }

    // Cek kepemilikan perangkat
    const perangkat = await Perangkat.findOne({
      idPerangkat: peringatan.idPerangkat,
      idPengguna: req.user._id
    });

    if (!perangkat) {
      return res.status(403).json({
        sukses: false,
        pesan: 'Anda tidak memiliki akses ke peringatan ini'
      });
    }

    // Update status peringatan
    peringatan.statusAktif = false;
    peringatan.waktuPenyelesaian = new Date();
    await peringatan.save();

    res.json({
      sukses: true,
      data: peringatan
    });
  } catch (error) {
    res.status(500).json({
      sukses: false,
      pesan: error.message
    });
  }
};
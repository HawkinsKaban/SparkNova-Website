// controllers/pengaturanController.js
const { PengaturanPerangkat, Perangkat } = require('../models');

exports.ambilPengaturan = async (req, res) => {
  try {
    const { idPerangkat } = req.params;

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

    const pengaturan = await PengaturanPerangkat.findOne({ idPerangkat });
    
    if (!pengaturan) {
      return res.status(404).json({
        sukses: false,
        pesan: 'Pengaturan perangkat tidak ditemukan'
      });
    }

    res.json({
      sukses: true,
      data: pengaturan
    });
  } catch (error) {
    res.status(500).json({
      sukses: false,
      pesan: error.message
    });
  }
};

exports.updatePengaturan = async (req, res) => {
    try {
      const { idPerangkat } = req.params;
      const { 
        jenisLayanan, 
        batasDaya, 
        persentasePeringatan, 
        tarifPPJ,
        wifiSSID,
        wifiPassword 
      } = req.body;
  
      // Cek kepemilikan perangkat
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
  
      // Update pengaturan
      const pengaturanBaru = await PengaturanPerangkat.findOneAndUpdate(
        { idPerangkat },
        {
          jenisLayanan,
          batasDaya,
          persentasePeringatan,
          tarifPPJ,
          wifiSSID,
          wifiPassword
        },
        { 
          new: true,
          runValidators: true 
        }
      );
  
      if (!pengaturanBaru) {
        return res.status(404).json({
          sukses: false,
          pesan: 'Pengaturan perangkat tidak ditemukan'
        });
      }
  
      // Update status perangkat menjadi 'konfigurasi'
      await Perangkat.findOneAndUpdate(
        { idPerangkat },
        { statusKoneksi: 'konfigurasi' }
      );
  
      res.json({
        sukses: true,
        data: pengaturanBaru
      });
    } catch (error) {
      res.status(500).json({
        sukses: false,
        pesan: error.message
      });
    }
  };
  
  exports.resetPengaturanDefault = async (req, res) => {
    try {
      const { idPerangkat } = req.params;
  
      // Cek kepemilikan perangkat
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
  
      // Reset ke pengaturan default
      const pengaturanDefault = {
        jenisLayanan: 'R1_900VA',
        batasDaya: 1000.00,
        persentasePeringatan: 80.00,
        tarifPPJ: 5.00
      };
  
      const pengaturanBaru = await PengaturanPerangkat.findOneAndUpdate(
        { idPerangkat },
        pengaturanDefault,
        { 
          new: true,
          runValidators: true 
        }
      );
  
      res.json({
        sukses: true,
        pesan: 'Pengaturan berhasil direset ke default',
        data: pengaturanBaru
      });
    } catch (error) {
      res.status(500).json({
        sukses: false,
        pesan: error.message
      });
    }
  };
  
  // Tambahan untuk menangani konfigurasi WiFi
  exports.updateKonfigurasiWifi = async (req, res) => {
    try {
      const { idPerangkat } = req.params;
      const { wifiSSID, wifiPassword } = req.body;
  
      // Cek kepemilikan perangkat
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
  
      // Update konfigurasi WiFi
      const pengaturanBaru = await PengaturanPerangkat.findOneAndUpdate(
        { idPerangkat },
        { wifiSSID, wifiPassword },
        { new: true }
      );
  
      // Update status perangkat
      await Perangkat.findOneAndUpdate(
        { idPerangkat },
        { 
          statusKoneksi: 'konfigurasi',
          waktuAktifTerakhir: new Date()
        }
      );
  
      res.json({
        sukses: true,
        pesan: 'Konfigurasi WiFi berhasil diperbarui',
        data: {
          wifiSSID: pengaturanBaru.wifiSSID,
          statusKoneksi: 'konfigurasi'
        }
      });
    } catch (error) {
      res.status(500).json({
        sukses: false,
        pesan: error.message
      });
    }
  };
  
  exports.ambilRiwayatKonfigurasi = async (req, res) => {
    try {
      const { idPerangkat } = req.params;
  
      // Cek kepemilikan perangkat
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
  
      // Ambil riwayat pengaturan (menggunakan timestamps dari schema)
      const pengaturan = await PengaturanPerangkat.findOne({ idPerangkat })
        .select('jenisLayanan batasDaya persentasePeringatan tarifPPJ updatedAt');
  
      res.json({
        sukses: true,
        data: {
          pengaturanTerkini: pengaturan,
          waktuUpdate: pengaturan.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({
        sukses: false,
        pesan: error.message
      });
    }
  };
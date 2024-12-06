const { 
    PembacaanEnergi, 
    Perangkat, 
    PengaturanPerangkat, 
    Peringatan,
    StatistikPenggunaan 
  } = require('../models');
  
  const LayananPerhitunganEnergi = require('../services/perhitunganEnergi');
  
  exports.catatPembacaanEnergi = async (req, res) => {
    try {
      const { idPerangkat, tegangan, arus, daya, energi, frekuensi, faktorDaya } = req.body;
  
      const perangkat = await Perangkat.findOne({ idPerangkat });
      if (!perangkat) {
        return res.status(404).json({
          sukses: false,
          pesan: 'Perangkat tidak ditemukan'
        });
      }
  
      const pengaturan = await PengaturanPerangkat.findOne({ idPerangkat });
      
      const pembacaan = await PembacaanEnergi.create({
        idPerangkat,
        tegangan,
        arus,
        daya,
        energi,
        frekuensi,
        faktorDaya
      });
  
      // Cek threshold daya
      if (daya > pengaturan.batasDaya) {
        await Peringatan.create({
          idPerangkat,
          jenis: 'kritis',
          pesan: `Penggunaan daya melebihi batas (${daya}W/${pengaturan.batasDaya}W)`
        });
      } else if (daya > (pengaturan.batasDaya * pengaturan.persentasePeringatan / 100)) {
        await Peringatan.create({
          idPerangkat,
          jenis: 'peringatan',
          pesan: `Penggunaan daya mendekati batas (${daya}W/${pengaturan.batasDaya}W)`
        });
      }
  
      // Update waktu aktif perangkat
      await Perangkat.findOneAndUpdate(
        { idPerangkat },
        { 
          waktuAktifTerakhir: new Date(),
          statusKoneksi: 'terhubung'
        }
      );
  
      res.status(201).json({
        sukses: true,
        data: pembacaan
      });
    } catch (error) {
      res.status(500).json({
        sukses: false,
        pesan: error.message
      });
    }
  };
  
  exports.ambilStatistikPenggunaan = async (req, res) => {
    try {
      const { idPerangkat, periode } = req.params;
      
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
      const { waktuMulai, waktuSelesai } = LayananPerhitunganEnergi.getRentangWaktu(periode);
  
      const pembacaan = await PembacaanEnergi.find({
        idPerangkat,
        waktuPembacaan: {
          $gte: waktuMulai,
          $lte: waktuSelesai
        }
      });
  
      const statistik = await LayananPerhitunganEnergi.hitungStatistikPenggunaan(
        pembacaan,
        pengaturan
      );
  
      const statistikBaru = await StatistikPenggunaan.findOneAndUpdate(
        {
          idPerangkat,
          periode,
          waktuMulai,
          waktuSelesai
        },
        {
          ...statistik,
          waktuMulai,
          waktuSelesai
        },
        { new: true, upsert: true }
      );
  
      res.json({
        sukses: true,
        data: statistikBaru
      });
    } catch (error) {
      res.status(500).json({
        sukses: false,
        pesan: error.message
      });
    }
  };
  
  exports.ambilRiwayatPenggunaan = async (req, res) => {
    try {
      const { idPerangkat } = req.params;
      const { dari, sampai } = req.query;
  
      const pembacaan = await PembacaanEnergi.find({
        idPerangkat,
        waktuPembacaan: {
          $gte: new Date(dari),
          $lte: new Date(sampai)
        }
      }).sort({ waktuPembacaan: 1 });
  
      res.json({
        sukses: true,
        data: pembacaan
      });
    } catch (error) {
      res.status(500).json({
        sukses: false,
        pesan: error.message
      });
    }
  };
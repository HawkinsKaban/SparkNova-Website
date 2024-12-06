const TARIF_LISTRIK = {
    R1_900VA: 1352,
    R1_1300VA: 1444,
    R1_2200VA: 1444,
    R2_3500VA: 1444,
    R3_6600VA: 1444
  };
  
  class LayananPerhitunganEnergi {
    static async hitungStatistikPenggunaan(pembacaan, pengaturan) {
      const {
        totalEnergi,
        dayaRataRata,
        dayaMaksimum,
        dayaMinimum
      } = this.hitungMetrikDasar(pembacaan);
  
      const {
        biayaDasar,
        biayaPPJ,
        totalBiaya
      } = this.hitungBiaya(totalEnergi, pengaturan.jenisLayanan, pengaturan.tarifPPJ);
  
      return {
        totalKwh: totalEnergi,
        ratarataDaya: dayaRataRata,
        dayaMaksimum,
        dayaMinimum,
        biayaDasar,
        biayaPPJ,
        totalBiaya
      };
    }
  
    static hitungMetrikDasar(pembacaan) {
      let totalEnergi = 0;
      let totalDaya = 0;
      let dayaMaksimum = 0;
      let dayaMinimum = Number.MAX_VALUE;
  
      pembacaan.forEach(data => {
        totalEnergi += data.energi;
        totalDaya += data.daya;
        dayaMaksimum = Math.max(dayaMaksimum, data.daya);
        dayaMinimum = Math.min(dayaMinimum, data.daya);
      });
  
      const dayaRataRata = pembacaan.length > 0 ? totalDaya / pembacaan.length : 0;
  
      return {
        totalEnergi,
        dayaRataRata,
        dayaMaksimum,
        dayaMinimum
      };
    }
  
    static hitungBiaya(totalEnergi, jenisLayanan, ppjRate) {
      const tarifPerKwh = TARIF_LISTRIK[jenisLayanan];
      const biayaDasar = totalEnergi * tarifPerKwh;
      const biayaPPJ = biayaDasar * (ppjRate / 100);
      const totalBiaya = biayaDasar + biayaPPJ;
  
      return {
        biayaDasar,
        biayaPPJ,
        totalBiaya
      };
    }
  
    static getRentangWaktu(periode) {
      const sekarang = new Date();
      let waktuMulai = new Date(sekarang);
  
      switch (periode) {
        case 'harian':
          waktuMulai.setHours(0, 0, 0, 0);
          break;
        case 'mingguan':
          waktuMulai.setDate(sekarang.getDate() - 7);
          break;
        case 'bulanan':
          waktuMulai.setMonth(sekarang.getMonth() - 1);
          break;
        default:
          throw new Error('Periode tidak valid');
      }
  
      return {
        waktuMulai,
        waktuSelesai: sekarang
      };
    }
  }
  
  module.exports = LayananPerhitunganEnergi;
  
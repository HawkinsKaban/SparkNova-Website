const { 
  EnergyReading, 
  Device, 
  DeviceSettings, 
  Alert, 
  UsageStatistics 
} = require('../models');
const EnergyCalculationService = require('./energyCalculation');
const moment = require('moment-timezone');

// Konstanta untuk service
const ENERGY_SERVICE_CONSTANTS = {
  READING_QUALITY_THRESHOLDS: {
      VOLTAGE: {
          MIN: 190,
          MAX: 250,
          WARNING_MIN: 200,
          WARNING_MAX: 240
      },
      CURRENT: {
          MAX: 100,
          WARNING: 80
      },
      POWER_FACTOR: {
          GOOD: 0.85,
          EXCELLENT: 0.95
      }
  },
  ALERT_TYPES: {
      POWER_DEVIATION: 'power_deviation',
      VOLTAGE_INSTABILITY: 'voltage_instability',
      HIGH_CONSUMPTION: 'high_consumption'
  }
};

class EnergyService {
  /**
   * Rekam pembacaan energi baru
   * @param {Object} readingData - Data pembacaan energi
   * @returns {Object} Pembacaan yang disimpan
   */
  static async recordReading(readingData) {
      try {
          const { 
              deviceId, 
              timestamp = new Date(), 
              readings 
          } = readingData;

          // Validasi data pembacaan
          this.validateReadingData(readings);

          // Buat pembacaan baru
          const reading = await EnergyReading.create({
              deviceId,
              readingTime: timestamp,
              voltage: readings.voltage,
              current: readings.current,
              power: readings.power,
              energy: readings.energy,
              frequency: readings.frequency || null,
              powerFactor: readings.powerFactor || null,
              powerConnected: readings.power_connected !== false
          });

          // Jalankan proses tambahan
          await Promise.all([
              this.updateDeviceStatus(deviceId, timestamp, readings),
              this.checkAndCreateAlerts(deviceId, readings),
              this.updateUsageStatistics(deviceId, reading)
          ]);

          return reading;
      } catch (error) {
          console.error('Kesalahan merekam pembacaan:', error);
          throw new Error(`Gagal merekam pembacaan: ${error.message}`);
      }
  }

  /**
   * Validasi data pembacaan
   * @param {Object} readings - Data pembacaan
   */
  static validateReadingData(readings) {
      const requiredFields = ['voltage', 'current', 'power', 'energy'];
      const missingFields = requiredFields.filter(field => !readings.hasOwnProperty(field));
      
      if (missingFields.length > 0) {
          throw new Error(`Bidang wajib hilang: ${missingFields.join(', ')}`);
      }

      // Validasi rentang nilai
      const { READING_QUALITY_THRESHOLDS } = ENERGY_SERVICE_CONSTANTS;
      
      if (readings.voltage < READING_QUALITY_THRESHOLDS.VOLTAGE.MIN || 
          readings.voltage > READING_QUALITY_THRESHOLDS.VOLTAGE.MAX) {
          console.warn(`Peringatan: Tegangan di luar rentang normal - ${readings.voltage}V`);
      }

      if (readings.current > READING_QUALITY_THRESHOLDS.CURRENT.MAX) {
          throw new Error(`Arus melebihi batas maksimum - ${readings.current}A`);
      }
  }

  /**
   * Perbarui status perangkat
   * @param {string} deviceId - ID perangkat
   * @param {Date} timestamp - Waktu pembacaan
   * @param {Object} readings - Data pembacaan
   */
  static async updateDeviceStatus(deviceId, timestamp, readings) {
      try {
          await Device.findOneAndUpdate(
              { deviceId },
              { 
                  lastConnection: timestamp,
                  status: 'connected',
                  currentPower: readings.power,
                  currentEnergy: readings.energy,
                  lastVoltage: readings.voltage,
                  lastCurrent: readings.current,
                  lastFrequency: readings.frequency,
                  lastPowerFactor: readings.powerFactor,
                  powerConnected: readings.power_connected !== false
              },
              { new: true }
          );
      } catch (error) {
          console.error('Kesalahan memperbarui status perangkat:', error);
      }
  }

  /**
   * Buat alert berdasarkan pembacaan
   * @param {string} deviceId - ID perangkat
   * @param {Object} readings - Data pembacaan
   */
  static async checkAndCreateAlerts(deviceId, readings) {
      try {
          const { READING_QUALITY_THRESHOLDS, ALERT_TYPES } = ENERGY_SERVICE_CONSTANTS;
          const alerts = [];

          // Cek tegangan
          if (readings.voltage < READING_QUALITY_THRESHOLDS.VOLTAGE.WARNING_MIN || 
              readings.voltage > READING_QUALITY_THRESHOLDS.VOLTAGE.WARNING_MAX) {
              alerts.push({
                  deviceId,
                  type: 'warning',
                  message: `Tegangan tidak stabil: ${readings.voltage}V`,
                  category: ALERT_TYPES.VOLTAGE_INSTABILITY
              });
          }

          // Cek daya
          const deviceSettings = await DeviceSettings.findOne({ deviceId });
          const powerLimit = deviceSettings?.powerLimit || 2200; // default 2200W
          const powerPercentage = (readings.power / powerLimit) * 100;

          if (powerPercentage > 80) {
              alerts.push({
                  deviceId,
                  type: powerPercentage > 95 ? 'critical' : 'warning',
                  message: `Penggunaan daya tinggi: ${readings.power}W (${powerPercentage.toFixed(1)}% dari batas)`,
                  category: ALERT_TYPES.HIGH_CONSUMPTION
              });
          }

          // Buat alert jika ada
          if (alerts.length > 0) {
              await Alert.insertMany(alerts);
          }
      } catch (error) {
          console.error('Kesalahan membuat alert:', error);
      }
  }

  /**
   * Perbarui statistik penggunaan
   * @param {string} deviceId - ID perangkat
   * @param {Object} reading - Pembacaan energi
   */
  static async updateUsageStatistics(deviceId, reading) {
      try {
          const now = new Date();
          const periods = [
              { type: 'daily', start: moment(now).startOf('day').toDate() },
              { type: 'weekly', start: moment(now).startOf('week').toDate() },
              { type: 'monthly', start: moment(now).startOf('month').toDate() }
          ];

          for (const period of periods) {
              await UsageStatistics.findOneAndUpdate(
                  { 
                      deviceId, 
                      period: period.type,
                      startTime: period.start,
                      endTime: moment(period.start).add(1, period.type).toDate()
                  },
                  {
                      $inc: {
                          totalKwh: reading.energy,
                          totalCost: reading.power * (EnergyCalculationService.CONSTANTS.ELECTRICITY_RATES.R1_900VA / 1000)
                      }
                  },
                  { 
                      upsert: true, 
                      new: true 
                  }
              );
          }
      } catch (error) {
          console.error('Kesalahan memperbarui statistik penggunaan:', error);
      }
  }

  /**
   * Dapatkan pembacaan terbaru
   * @param {string} deviceId - ID perangkat
   * @returns {Object|null} Pembacaan terbaru
   */
  static async getLatestReading(deviceId) {
    try {
      // Validate device exists
      const device = await Device.findOne({ deviceId })
        .select('relayState status lastConnection');
        
      if (!device) {
        throw new Error('Device tidak ditemukan');
      }
  
      // Get latest energy reading
      const latestReading = await EnergyReading.findOne({ deviceId })
        .select('power energy readingTime voltage current powerFactor frequency powerConnected')
        .sort({ readingTime: -1 });
  
      // Format time
      const formatTime = (date) => {
        if (!date) return null;
        return {
          iso: date.toISOString(),
          local: date.toLocaleString('id-ID', { 
            timeZone: 'Asia/Jakarta',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          })
        };
      };
  
      // Check if device is offline
      const isOffline = !device.lastConnection || 
        (Date.now() - device.lastConnection.getTime()) > 5 * 60 * 1000;
  
      return {
        deviceId,
        status: {
          relayState: device.relayState,
          deviceStatus: isOffline ? 'disconnected' : device.status,
          lastConnection: formatTime(device.lastConnection)
        },
        readings: latestReading ? {
          power: Number(latestReading.power.toFixed(1)),
          energy: Number(latestReading.energy.toFixed(3)),
          voltage: Number(latestReading.voltage.toFixed(1)),
          current: Number(latestReading.current.toFixed(3)),
          powerFactor: latestReading.powerFactor ? Number(latestReading.powerFactor.toFixed(2)) : null,
          frequency: latestReading.frequency ? Number(latestReading.frequency.toFixed(1)) : null,
          powerConnected: latestReading.powerConnected,
          timestamp: formatTime(latestReading.readingTime)
        } : null
      };
  
    } catch (error) {
      console.error('Error getting latest reading:', error);
      throw new Error(`Gagal mendapatkan pembacaan terkini: ${error.message}`);
    }
  }

  /**
   * Dapatkan riwayat penggunaan
   * @param {string} deviceId - ID perangkat
   * @param {Object} timeRange - Rentang waktu
   * @returns {Object} Riwayat penggunaan
   */
  static async getUsageHistory(deviceId, timeRange) {
      try {
          const [readings, device, settings] = await Promise.all([
              EnergyReading.find({
                  deviceId,
                  readingTime: {
                      $gte: timeRange.startTime,
                      $lte: timeRange.endTime
                  }
              }).sort({ readingTime: 1 }),
              Device.findOne({ deviceId }),
              DeviceSettings.findOne({ deviceId })
          ]);

          if (!readings.length) {
              return this.getEmptyUsageHistory(deviceId, device, timeRange);
          }

          // Hitung metrik
          const summary = this.calculateSummary(readings);
          const usage = this.calculateUsageMetrics(readings);
          const hourlyData = this.calculateHourlyData(readings);
          const patterns = this.calculateUsagePatterns(readings);

          // Hitung biaya
          const costAnalysis = this.calculateCostAnalysis(
              readings, 
              settings || {}, 
              summary
          );

          return {
              device: {
                  id: deviceId,
                  name: device?.name || 'Unnamed Device',
                  status: device?.status || 'unknown'
              },
              timeRange: {
                  startTime: timeRange.startTime.toISOString(),
                  endTime: timeRange.endTime.toISOString(),
                  period: timeRange.period
              },
              summary,
              usage,
              patterns,
              hourlyData,
              costs: costAnalysis,
              data: readings.map(this.processReading)
          };
      } catch (error) {
          console.error('Kesalahan mengambil riwayat penggunaan:', error);
          throw new Error('Gagal mengambil riwayat penggunaan');
      }
  }

  /**
   * Hitung ringkasan pembacaan
   * @param {Array} readings - Daftar pembacaan
   * @returns {Object} Ringkasan
   */
  static calculateSummary(readings) {
      if (!readings?.length) return this.getEmptySummary();

      const powers = readings.map(r => r.power);
      const lastReading = readings[readings.length - 1];
      const firstReading = readings[0];

      return {
          totalEnergy: Number((lastReading.energy - firstReading.energy).toFixed(3)),
          averagePower: Number(this.calculateAverage(powers).toFixed(2)),
          maximumPower: Number(Math.max(...powers).toFixed(2)),
          minimumPower: Number(Math.min(...powers).toFixed(2)),
          readingCount: readings.length
      };
  }

  /**
   * Hitung metrik penggunaan
   * @param {Array} readings - Daftar pembacaan
   * @returns {Object} Metrik penggunaan
   */
  static calculateUsageMetrics(readings) {
      if (!readings?.length) return this.getEmptyUsageMetrics();

      const powers = readings.map(r => r.power);
      const voltages = readings.map(r => r.voltage);
      const currents = readings.map(r => r.current);
      const lastReading = readings[readings.length - 1];
      const firstReading = readings[0];

      return {
          readingCount: readings.length,
          totalEnergy: Number((lastReading.energy - firstReading.energy).toFixed(3)),
          avgPower: Number(this.calculateAverage(powers).toFixed(2)),
          maxPower: Number(Math.max(...powers).toFixed(2)),
          minPower: Number(Math.min(...powers).toFixed(2)),
          avgVoltage: Number(this.calculateAverage(voltages).toFixed(1)),
          avgCurrent: Number(this.calculateAverage(currents).toFixed(2))
      };
  }

  /**
   * Hitung pola penggunaan
   * @param {Array} readings - Daftar pembacaan
   * @returns {Object} Pola penggunaan
   */
  static calculateUsagePatterns(readings) {
      return {
          hourly: this.calculateHourlyPattern(readings),
          daily: this.calculateDailyPattern(readings)
      };
  }

  /**
   * Hitung pola per jam
   * @param {Array} readings - Daftar pembacaan
   * @returns {Array} Pola per jam
   */
  static calculateHourlyPattern(readings) {
      const hours = Array(24).fill().map(() => ({
          count: 0,
          totalPower: 0
      }));

      readings.forEach(reading => {
          const hour = new Date(reading.readingTime).getHours();
          hours[hour].count++;
          hours[hour].totalPower += reading.power;
      });

      return hours.map((data, hour) => ({
          hour,
          avgPower: data.count 
              ? Number((data.totalPower / data.count).toFixed(2)) 
              : 0
      }));
  }

  /**
   * Hitung pola per hari
   * @param {Array} readings - Daftar pembacaan
   * @returns {Array} Pola per hari
   */
  static calculateDailyPattern(readings) {
    const days = Array(7).fill().map(() => ({
        count: 0,
        totalPower: 0
    }));

    readings.forEach(reading => {
        const day = new Date(reading.readingTime).getDay();
        days[day].count++;
        days[day].totalPower += reading.power;
    });

    return days.map((data, day) => ({
        day,
        avgPower: data.count 
            ? Number((data.totalPower / data.count).toFixed(2)) 
            : 0
    }));
}

/**
 * Hitung data per jam
 * @param {Array} readings - Daftar pembacaan
 * @returns {Array} Data per jam
 */
static calculateHourlyData(readings) {
    if (!readings?.length) return [];

    return readings.map(reading => ({
        readingTime: reading.readingTime.toISOString(),
        power: Number(reading.power.toFixed(2)),
        energy: Number(reading.energy.toFixed(3)),
        voltage: Number(reading.voltage.toFixed(1)),
        current: Number(reading.current.toFixed(2))
    }));
}

/**
 * Hitung analisis biaya
 * @param {Array} readings - Daftar pembacaan
 * @param {Object} settings - Pengaturan perangkat
 * @param {Object} summary - Ringkasan pembacaan
 * @returns {Object} Analisis biaya
 */
static calculateCostAnalysis(readings, settings, summary) {
    if (!readings?.length) return null;

    const serviceType = settings.serviceType || 'R1_900VA';
    const baseRate = EnergyCalculationService.CONSTANTS.ELECTRICITY_RATES[serviceType];
    const taxRate = settings.taxRate || 0.05; // Default 5%
    const adminFeeRate = 0.01; // 1% biaya admin

    const totalEnergy = summary.totalEnergy;
    const baseCost = totalEnergy * baseRate;
    const taxAmount = baseCost * taxRate;
    const adminFee = baseCost * adminFeeRate;
    const totalCost = baseCost + taxAmount + adminFee;

    return {
        usage: {
            kwh: Number(totalEnergy.toFixed(3)),
            rateCategory: serviceType
        },
        rates: {
            baseRate,
            ppjTaxRate: taxRate * 100,
            adminFeeRate: adminFeeRate * 100
        },
        costs: {
            base: Math.round(baseCost),
            ppjTax: Math.round(taxAmount),
            adminFee: Math.round(adminFee),
            total: Math.round(totalCost),
            formatted: this.formatCurrency(totalCost)
        }
    };
}

/**
 * Proses pembacaan tunggal
 * @param {Object} reading - Pembacaan energi
 * @returns {Object} Pembacaan yang diproses
 */
static processReading(reading) {
    return {
        timestamp: reading.readingTime.toISOString(),
        voltage: Number(reading.voltage.toFixed(1)),
        current: Number(reading.current.toFixed(2)),
        power: Number(reading.power.toFixed(2)),
        energy: Number(reading.energy.toFixed(3)),
        frequency: reading.frequency ? Number(reading.frequency.toFixed(1)) : null,
        powerFactor: reading.powerFactor ? Number(reading.powerFactor.toFixed(2)) : null,
        powerConnected: reading.powerConnected
    };
}

/**
 * Dapatkan respons riwayat penggunaan kosong
 * @param {string} deviceId - ID perangkat
 * @param {Object} device - Objek perangkat
 * @param {Object} timeRange - Rentang waktu
 * @returns {Object} Respons kosong
 */
static getEmptyUsageHistory(deviceId, device, timeRange) {
    return {
        device: {
            id: deviceId,
            name: device?.name || 'Unnamed Device',
            status: device?.status || 'unknown'
        },
        timeRange: {
            startTime: timeRange.startTime.toISOString(),
            endTime: timeRange.endTime.toISOString(),
            period: timeRange.period
        },
        summary: this.getEmptySummary(),
        usage: this.getEmptyUsageMetrics(),
        patterns: this.getEmptyPatterns(),
        hourlyData: [],
        costs: null,
        data: []
    };
}

/**
 * Dapatkan ringkasan kosong
 * @returns {Object} Ringkasan kosong
 */
static getEmptySummary() {
    return {
        totalEnergy: 0,
        averagePower: 0,
        maximumPower: 0,
        minimumPower: 0,
        readingCount: 0
    };
}

/**
 * Dapatkan metrik penggunaan kosong
 * @returns {Object} Metrik penggunaan kosong
 */
static getEmptyUsageMetrics() {
    return {
        readingCount: 0,
        totalEnergy: 0,
        avgPower: 0,
        maxPower: 0,
        minPower: 0,
        avgVoltage: 0,
        avgCurrent: 0
    };
}

/**
 * Dapatkan pola kosong
 * @returns {Object} Pola kosong
 */
static getEmptyPatterns() {
    return {
        hourly: Array(24).fill().map((_, hour) => ({
            hour,
            avgPower: 0
        })),
        daily: Array(7).fill().map((_, day) => ({
            day,
            avgPower: 0
        }))
    };
}

/**
 * Hitung rata-rata
 * @param {Array} values - Daftar nilai
 * @returns {number} Rata-rata
 */
static calculateAverage(values) {
    if (!values?.length) return 0;
    const validValues = values.filter(v => !isNaN(v) && v !== null);
    return validValues.length 
        ? validValues.reduce((a, b) => a + b, 0) / validValues.length 
        : 0;
}

/**
 * Format mata uang
 * @param {number} amount - Jumlah yang akan diformat
 * @returns {string} Mata uang yang diformat
 */
static formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Dapatkan status tegangan
 * @param {number} voltage - Tegangan
 * @returns {string} Status tegangan
 */
static getVoltageStatus(voltage) {
    const { READING_QUALITY_THRESHOLDS } = ENERGY_SERVICE_CONSTANTS;
    if (voltage < READING_QUALITY_THRESHOLDS.VOLTAGE.MIN) return 'low';
    if (voltage > READING_QUALITY_THRESHOLDS.VOLTAGE.MAX) return 'high';
    return 'normal';
}

/**
 * Dapatkan status daya
 * @param {number} percentage - Persentase penggunaan daya
 * @returns {string} Status daya
 */
static getPowerStatus(percentage) {
    if (percentage >= 95) return 'critical';
    if (percentage >= 80) return 'warning';
    return 'normal';
}

/**
 * Ekspor data energi
 * @param {string} deviceId - ID perangkat
 * @param {Object} options - Opsi ekspor
 * @returns {Object} Data yang diekspor
 */
static async exportEnergyData(deviceId, options = {}) {
    const { 
        startDate = moment().subtract(30, 'days').toDate(), 
        endDate = new Date(),
        format = 'json' 
    } = options;

    try {
        const readings = await EnergyReading.find({
            deviceId,
            readingTime: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ readingTime: 1 });

        const processedReadings = readings.map(this.processReading);
        const summary = this.calculateSummary(readings);
        const costAnalysis = await this.calculateCostAnalysis(
            readings, 
            await DeviceSettings.findOne({ deviceId }) || {}, 
            summary
        );

        const exportData = {
            deviceId,
            exportPeriod: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            },
            summary,
            costAnalysis,
            readings: processedReadings
        };

        // Tambahkan dukungan format ekspor lain jika diperlukan
        return exportData;
    } catch (error) {
        console.error('Kesalahan mengekspor data energi:', error);
        throw new Error('Gagal mengekspor data energi');
    }
}

/**
 * Analyze energy efficiency
 * @param {string} deviceId - Device ID
 * @param {Object} timeRange - Time range
 * @returns {Object} Efficiency analysis
 */
static async analyzeEnergyEfficiency(deviceId, timeRange) {
  try {
      const readings = await EnergyReading.find({
          deviceId,
          readingTime: {
              $gte: timeRange.startTime,
              $lte: timeRange.endTime
          }
      }).sort({ readingTime: 1 });

      const settings = await DeviceSettings.findOne({ deviceId });
      
      const powerLimit = settings?.powerLimit || 2200;
      const powerAnalysis = this.analyzePowerUsage(readings, powerLimit);
      const powerFactorAnalysis = this.analyzePowerFactorTrends(readings);
      const voltageAnalysis = this.analyzeVoltageQuality(readings);

      // Generate recommendations based on analysis
      const recommendations = this.generateEfficiencyRecommendations(
          powerAnalysis,
          powerFactorAnalysis,
          voltageAnalysis
      );

      return {
          analysis: {
              power: powerAnalysis,
              powerFactor: powerFactorAnalysis,
              voltage: voltageAnalysis
          },
          recommendations,
          improvementPotential: this.calculateImprovementPotential(
              powerAnalysis,
              powerFactorAnalysis
          )
      };
  } catch (error) {
      throw new Error(`Failed to analyze energy efficiency: ${error.message}`);
  }
}

/**
* Analyze power usage patterns
* @param {Array} readings - Energy readings
* @param {number} powerLimit - Power limit
* @returns {Object} Power analysis
*/
static analyzePowerUsage(readings, powerLimit) {
  if (!readings?.length) return null;

  const powers = readings.map(r => r.power);
  const avgPower = this.calculateAverage(powers);
  const maxPower = Math.max(...powers);
  const utilization = (avgPower / powerLimit) * 100;

  return {
      average: Number(avgPower.toFixed(2)),
      maximum: Number(maxPower.toFixed(2)),
      utilization: Number(utilization.toFixed(2)),
      overLimit: powers.filter(p => p > powerLimit).length,
      efficiency: this.calculatePowerEfficiency(powers, powerLimit)
  };
}

/**
* Analyze power factor trends
* @param {Array} readings - Energy readings
* @returns {Object} Power factor analysis
*/
static analyzePowerFactorTrends(readings) {
  if (!readings?.length) return null;

  const powerFactors = readings
      .map(r => r.powerFactor)
      .filter(pf => pf !== null);

  if (!powerFactors.length) return null;

  const { POWER_FACTOR } = ENERGY_SERVICE_CONSTANTS.READING_QUALITY_THRESHOLDS;

  return {
      average: Number(this.calculateAverage(powerFactors).toFixed(3)),
      minimum: Number(Math.min(...powerFactors).toFixed(3)),
      belowGood: powerFactors.filter(pf => pf < POWER_FACTOR.GOOD).length,
      excellent: powerFactors.filter(pf => pf >= POWER_FACTOR.EXCELLENT).length,
      trend: this.calculateTrend(powerFactors)
  };
}

/**
* Analyze voltage quality
* @param {Array} readings - Energy readings
* @returns {Object} Voltage quality analysis
*/
static analyzeVoltageQuality(readings) {
  if (!readings?.length) return null;

  const voltages = readings.map(r => r.voltage);
  const { VOLTAGE } = ENERGY_SERVICE_CONSTANTS.READING_QUALITY_THRESHOLDS;

  const deviations = voltages.filter(v => 
      v < VOLTAGE.MIN || v > VOLTAGE.MAX
  );

  return {
      average: Number(this.calculateAverage(voltages).toFixed(1)),
      stability: this.calculateVoltageStability(voltages),
      deviations: deviations.length,
      deviationPercentage: Number(
          (deviations.length / voltages.length * 100).toFixed(2)
      )
  };
}

/**
* Calculate trend
* @param {Array} values - Values to analyze
* @returns {string} Trend direction
*/
static calculateTrend(values) {
  if (values.length < 2) return 'insufficient_data';

  const changes = values.slice(1).map((val, i) => val - values[i]);
  const avgChange = this.calculateAverage(changes);

  if (Math.abs(avgChange) < 0.001) return 'stable';
  return avgChange > 0 ? 'improving' : 'degrading';
}

/**
* Calculate power efficiency
* @param {Array} powers - Power readings
* @param {number} limit - Power limit
* @returns {Object} Efficiency metrics
*/
static calculatePowerEfficiency(powers, limit) {
  const avgPower = this.calculateAverage(powers);
  const idealPower = limit * 0.8; // 80% of limit is considered ideal

  const efficiency = Math.min(
      100,
      ((idealPower - Math.abs(idealPower - avgPower)) / idealPower) * 100
  );

  return {
      score: Number(efficiency.toFixed(2)),
      rating: this.getPowerEfficiencyRating(efficiency),
      potentialSavings: avgPower > idealPower ? 
          Number((avgPower - idealPower).toFixed(2)) : 0
  };
}

/**
* Calculate voltage stability
* @param {Array} voltages - Voltage readings
* @returns {Object} Stability analysis
*/
static calculateVoltageStability(voltages) {
  const avg = this.calculateAverage(voltages);
  const variations = voltages.map(v => Math.abs(v - avg));
  const avgVariation = this.calculateAverage(variations);

  const stabilityScore = Math.max(0, 100 - (avgVariation / 2));

  return {
      score: Number(stabilityScore.toFixed(2)),
      rating: this.getStabilityRating(stabilityScore),
      variation: Number(avgVariation.toFixed(2))
  };
}

/**
* Calculate improvement potential
* @param {Object} powerAnalysis - Power analysis results
* @param {Object} powerFactorAnalysis - Power factor analysis results
* @returns {Object} Improvement potential
*/
static calculateImprovementPotential(powerAnalysis, powerFactorAnalysis) {
  let potentialSavings = 0;
  const improvements = [];

  if (powerAnalysis.efficiency.potentialSavings > 0) {
      potentialSavings += powerAnalysis.efficiency.potentialSavings;
      improvements.push({
          type: 'power_optimization',
          savingsPotential: powerAnalysis.efficiency.potentialSavings,
          priority: 'high'
      });
  }

  if (powerFactorAnalysis?.average < 0.9) {
      const pfImprovementPotential = 
          ((0.9 - powerFactorAnalysis.average) / 0.9) * 100;
      improvements.push({
          type: 'power_factor_correction',
          improvementPotential: Number(pfImprovementPotential.toFixed(2)),
          priority: pfImprovementPotential > 10 ? 'high' : 'medium'
      });
  }

  return {
      energySavings: Number(potentialSavings.toFixed(2)),
      improvements,
      priority: potentialSavings > 500 ? 'immediate' : 'planned'
  };
}

/**
* Generate efficiency recommendations
* @param {Object} powerAnalysis - Power analysis results
* @param {Object} powerFactorAnalysis - Power factor analysis results
* @param {Object} voltageAnalysis - Voltage analysis results
* @returns {Array} Recommendations
*/
static generateEfficiencyRecommendations(
  powerAnalysis, 
  powerFactorAnalysis, 
  voltageAnalysis
) {
  const recommendations = [];

  // Power usage recommendations
  if (powerAnalysis.efficiency.potentialSavings > 0) {
      recommendations.push({
          category: 'power_usage',
          priority: 'high',
          message: `Potensi penghematan daya sebesar ${powerAnalysis.efficiency.potentialSavings.toFixed(2)}W teridentifikasi`,
          actions: ['Distribusi beban yang lebih merata', 'Optimasi jadwal penggunaan peralatan']
      });
  }

  // Power factor recommendations
  if (powerFactorAnalysis?.average < 0.9) {
      recommendations.push({
          category: 'power_factor',
          priority: 'medium',
          message: 'Faktor daya rata-rata di bawah optimal',
          actions: ['Evaluasi instalasi kapasitor bank', 'Periksa kualitas peralatan listrik']
      });
  }

  // Voltage stability recommendations
  if (voltageAnalysis.deviationPercentage > 5) {
      recommendations.push({
          category: 'voltage_quality',
          priority: 'high',
          message: 'Stabilitas tegangan perlu ditingkatkan',
          actions: ['Pasang voltage stabilizer', 'Periksa kualitas instalasi listrik']
      });
  }

  return recommendations;
}

/**
* Get power efficiency rating
* @param {number} efficiency - Efficiency score
* @returns {string} Efficiency rating
*/
static getPowerEfficiencyRating(efficiency) {
  if (efficiency >= 90) return 'excellent';
  if (efficiency >= 80) return 'good';
  if (efficiency >= 70) return 'fair';
  return 'poor';
}

/**
* Get stability rating
* @param {number} score - Stability score
* @returns {string} Stability rating
*/
static getStabilityRating(score) {
  if (score >= 95) return 'excellent';
  if (score >= 85) return 'good';
  if (score >= 75) return 'fair';
  return 'poor';
}

/**
* Analyze daily consumption patterns
* @param {string} deviceId - Device ID
* @param {Object} timeRange - Time range
* @returns {Object} Consumption patterns
*/
static async getConsumptionPatterns(deviceId, timeRange) {
  try {
      const readings = await EnergyReading.find({
          deviceId,
          readingTime: {
              $gte: timeRange.startTime,
              $lte: timeRange.endTime
          }
      }).sort({ readingTime: 1 });

      if (!readings.length) return null;

      const hourlyPatterns = this.calculateHourlyPattern(readings);
      const dailyPatterns = this.calculateDailyPattern(readings);
      const peakUsage = this.analyzePeakUsage(readings);

      return {
          patterns: {
              hourly: hourlyPatterns,
              daily: dailyPatterns
          },
          peakAnalysis: peakUsage,
          recommendations: this.generatePatternRecommendations(
              hourlyPatterns,
              dailyPatterns,
              peakUsage
          )
      };
  } catch (error) {
      throw new Error(`Failed to analyze consumption patterns: ${error.message}`);
  }
}

/**
* Analyze peak usage
* @param {Array} readings - Energy readings
* @returns {Object} Peak usage analysis
*/
static analyzePeakUsage(readings) {
  if (!readings?.length) return null;

  const hourlyGroups = readings.reduce((acc, reading) => {
      const hour = new Date(reading.readingTime).getHours();
      if (!acc[hour]) {
          acc[hour] = { powers: [], count: 0 };
      }
      acc[hour].powers.push(reading.power);
      acc[hour].count++;
      return acc;
  }, {});

  const peakHours = Object.entries(hourlyGroups)
      .map(([hour, data]) => ({
          hour: parseInt(hour),
          avgPower: this.calculateAverage(data.powers),
          maxPower: Math.max(...data.powers),
          readingCount: data.count
      }))
      .sort((a, b) => b.avgPower - a.avgPower)
      .slice(0, 3);

  return {
      peakHours,
      analysis: this.analyzePeakDistribution(peakHours),
      recommendations: this.generatePeakUsageRecommendations(peakHours)
  };
}

/**
* Generate pattern recommendations
* @param {Array} hourlyPatterns - Hourly patterns
* @param {Array} dailyPatterns - Daily patterns
* @param {Object} peakUsage - Peak usage analysis
* @returns {Array} Recommendations
*/
static generatePatternRecommendations(hourlyPatterns, dailyPatterns, peakUsage) {
  const recommendations = [];

  // Add pattern-based recommendations
  // You can implement detailed logic here based on the patterns

  return recommendations;
}

/**
* Analyze alert history
* @param {string} deviceId - Device ID
* @param {Object} timeRange - Time range
* @returns {Object} Alert analysis
*/
static async analyzeAlertHistory(deviceId, timeRange) {
  try {
      const alerts = await Alert.find({
          deviceId,
          createdAt: {
              $gte: timeRange.startTime,
              $lte: timeRange.endTime
          }
      }).sort({ createdAt: 1 });

      if (!alerts.length) return null;

      const categorizedAlerts = this.categorizeAlerts(alerts);
      const trends = this.analyzeAlertTrends(alerts);

      return {
          summary: {
              total: alerts.length,
              critical: alerts.filter(a => a.type === 'critical').length,
              warning: alerts.filter(a => a.type === 'warning').length
          },
          categories: categorizedAlerts,
          trends,
          recommendations: this.generateAlertBasedRecommendations(
              categorizedAlerts,
              trends
          )
      };
  } catch (error) {
      throw new Error(`Failed to analyze alert history: ${error.message}`);
  }
}

/**
* Categorize alerts
* @param {Array} alerts - Alert records
* @returns {Object} Categorized alerts
*/
static categorizeAlerts(alerts) {
  return alerts.reduce((acc, alert) => {
      if (!acc[alert.category]) {
          acc[alert.category] = {
              count: 0,
              critical: 0,
              warning: 0
          };
      }
      acc[alert.category].count++;
      acc[alert.category][alert.type]++;
      return acc;
  }, {});
}
}

// Ekspor service
module.exports = EnergyService;
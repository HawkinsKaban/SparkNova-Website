const { EnergyReading, Device, DeviceSettings, Alert } = require('../models');
const moment = require('moment-timezone');

/**
 * Konstanta untuk perhitungan energi
 */
const ENERGY_CONSTANTS = {
    // Tarif listrik PLN per kategori layanan (per kWh)
    ELECTRICITY_RATES: {
        R1_450VA: 415,      // Subsidi
        R1_900VA: 1352,     // Non-subsidi
        R1_1300VA: 1444.70,
        R1_2200VA: 1444.70,
        R2_3500VA: 1444.70,
        R2_5500VA: 1444.70,
        R3_6600VA: 1444.70,
        B2_6600VA: 1444.70, // Bisnis
        I3_6600VA: 1444.70  // Industri
    },

    // Faktor emisi karbon
    CARBON_EMISSION_FACTOR: 0.7,  // kg CO2 per kWh

    // Ambang batas kualitas daya
    POWER_QUALITY_THRESHOLDS: {
        VOLTAGE: {
            MIN: 190,
            MAX: 250,
            CRITICAL_MIN: 180,
            CRITICAL_MAX: 260
        },
        CURRENT: {
            MIN: 0,
            MAX: 100,
            WARNING: 80
        },
        POWER_FACTOR: {
            MIN: 0,
            MAX: 1,
            GOOD: 0.85,
            EXCELLENT: 0.95
        }
    },

    // Pajak dan biaya tambahan
    TAX_RATES: {
        DEFAULT: 0.05,      // 5% pajak
        ADMIN_FEE: 0.01     // 1% biaya admin
    }
};

class EnergyCalculationService {
    /**
     * Perhitungan komprehensif penggunaan energi
     * @param {string} deviceId - ID perangkat
     * @param {Object} timeRange - Rentang waktu perhitungan
     * @returns {Object} Analisis penggunaan energi
     */
    static async calculateComprehensiveUsage(deviceId, timeRange) {
        try {
            // Validasi input
            if (!deviceId) throw new Error('Device ID wajib diisi');
            if (!timeRange) throw new Error('Rentang waktu wajib diisi');

            // Ambil pembacaan dan pengaturan
            const [readings, device, settings] = await Promise.all([
                this.getReadings(deviceId, timeRange),
                Device.findOne({ deviceId }),
                DeviceSettings.findOne({ deviceId })
            ]);

            // Hitung metrik dasar
            const baseMetrics = this.calculateBaseMetrics(readings);
            
            // Hitung analitik lanjutan
            const advancedAnalytics = this.calculateAdvancedAnalytics(readings);

            // Hitung biaya
            const costAnalysis = this.calculateCostAnalysis(
                readings, 
                settings || {},
                baseMetrics
            );

            // Hitung efisiensi energi
            const efficiencyAnalysis = this.calculateEfficiencyMetrics(
                baseMetrics, 
                settings || {}
            );

            // Hasilkan rekomendasi
            const recommendations = this.generateRecommendations(
                baseMetrics, 
                advancedAnalytics, 
                costAnalysis
            );

            return {
                deviceId,
                device: {
                    name: device?.name || 'Unnamed Device',
                    status: device?.status || 'unknown'
                },
                timeRange: {
                    start: timeRange.startTime,
                    end: timeRange.endTime,
                    period: timeRange.period
                },
                baseMetrics,
                advancedAnalytics,
                costAnalysis,
                efficiencyAnalysis,
                recommendations,
                rawData: readings
            };
        } catch (error) {
            console.error('Kesalahan perhitungan komprehensif:', error);
            throw new Error(`Gagal menghitung penggunaan energi: ${error.message}`);
        }
    }

    /**
     * Ambil pembacaan energi
     * @param {string} deviceId - ID perangkat
     * @param {Object} timeRange - Rentang waktu
     * @returns {Array} Daftar pembacaan
     */
    static async getReadings(deviceId, timeRange) {
        return await EnergyReading.find({
            deviceId,
            readingTime: {
                $gte: timeRange.startTime,
                $lte: timeRange.endTime
            }
        }).sort({ readingTime: 1 });
    }

    /**
     * Hitung metrik dasar
     * @param {Array} readings - Daftar pembacaan
     * @returns {Object} Metrik dasar
     */
    static calculateBaseMetrics(readings) {
        if (!readings?.length) return this.getEmptyMetrics();

        const powerReadings = readings.map(r => r.power);
        const voltageReadings = readings.map(r => r.voltage);
        const currentReadings = readings.map(r => r.current);
        const energyReadings = readings.map(r => r.energy);

        return {
            power: {
                average: this.calculateAverage(powerReadings),
                max: Math.max(...powerReadings),
                min: Math.min(...powerReadings),
                total: powerReadings.reduce((a, b) => a + b, 0)
            },
            voltage: {
                average: this.calculateAverage(voltageReadings),
                max: Math.max(...voltageReadings),
                min: Math.min(...voltageReadings)
            },
            current: {
                average: this.calculateAverage(currentReadings),
                max: Math.max(...currentReadings),
                min: Math.min(...currentReadings)
            },
            energy: {
                total: this.calculateTotalEnergy(energyReadings),
                start: energyReadings[0],
                end: energyReadings[energyReadings.length - 1]
            },
            readingCount: readings.length,
            timespan: this.calculateTimespan(readings)
        };
    }

    /**
     * Hitung analitik lanjutan
     * @param {Array} readings - Daftar pembacaan
     * @returns {Object} Analitik lanjutan
     */
    static calculateAdvancedAnalytics(readings) {
        return {
            powerFactorAnalysis: this.analyzePowerFactor(readings),
            frequencyStability: this.analyzeFrequencyStability(readings),
            harmonicAnalysis: this.analyzeHarmonics(readings),
            performanceTrends: this.calculatePerformanceTrends(readings)
        };
    }

    /**
     * Perhitungan analisis biaya
     * @param {Array} readings - Daftar pembacaan
     * @param {Object} settings - Pengaturan perangkat
     * @param {Object} baseMetrics - Metrik dasar
     * @returns {Object} Analisis biaya
     */
    static calculateCostAnalysis(readings, settings, baseMetrics) {
        if (!readings?.length) return null;

        const serviceType = settings.serviceType || 'R1_900VA';
        const baseRate = ENERGY_CONSTANTS.ELECTRICITY_RATES[serviceType];
        const taxRate = settings.taxRate || ENERGY_CONSTANTS.TAX_RATES.DEFAULT;
        const adminFeeRate = ENERGY_CONSTANTS.TAX_RATES.ADMIN_FEE;

        const totalEnergy = baseMetrics.energy.total;
        const baseCost = totalEnergy * baseRate;
        const taxAmount = baseCost * taxRate;
        const adminFee = baseCost * adminFeeRate;
        const totalCost = baseCost + taxAmount + adminFee;

        return {
            energyConsumption: {
                total: totalEnergy,
                unit: 'kWh'
            },
            rates: {
                baseRate,
                serviceType,
                taxRate: taxRate * 100,
                adminFeeRate: adminFeeRate * 100
            },
            costs: {
                baseEnergyCost: Math.round(baseCost),
                taxAmount: Math.round(taxAmount),
                adminFee: Math.round(adminFee),
                totalCost: Math.round(totalCost),
                formattedTotalCost: this.formatCurrency(totalCost)
            }
        };
    }

    /**
     * Hitung metrik efisiensi
     * @param {Object} baseMetrics - Metrik dasar
     * @param {Object} settings - Pengaturan perangkat
     * @returns {Object} Metrik efisiensi
     */
    static calculateEfficiencyMetrics(baseMetrics, settings) {
        const powerLimit = settings.powerLimit || 2200; // default 2200W
        const maxPower = baseMetrics.power.max;
        const averagePower = baseMetrics.power.average;

        return {
            powerUtilization: {
                peak: (maxPower / powerLimit) * 100,
                average: (averagePower / powerLimit) * 100
            },
            carbonEmissions: this.calculateCarbonEmissions(baseMetrics.energy.total),
            potentialSavings: this.calculatePotentialEnergySavings(
                baseMetrics, 
                powerLimit
            )
        };
    }

    /**
     * Hasilkan rekomendasi
     * @param {Object} baseMetrics - Metrik dasar
     * @param {Object} advancedAnalytics - Analitik lanjutan
     * @param {Object} costAnalysis - Analisis biaya
     * @returns {Array} Daftar rekomendasi
     */
    static generateRecommendations(baseMetrics, advancedAnalytics, costAnalysis) {
        const recommendations = [];

        // Rekomendasi efisiensi daya
        if (baseMetrics.power.average > 1500) {
            recommendations.push({
                type: 'efficiency',
                priority: 'high',
                message: 'Konsumsi daya rata-rata tinggi. Pertimbangkan untuk mengoptimalkan penggunaan peralatan.'
            });
        }

        // Rekomendasi faktor daya
        if (advancedAnalytics.powerFactorAnalysis.average < 0.8) {
            recommendations.push({
                type: 'power_factor',
                priority: 'medium',
                message: 'Faktor daya rendah. Pertimbangkan perbaikan instalasi listrik.'
            });
        }

        // Rekomendasi biaya
        if (costAnalysis && costAnalysis.costs.totalCost > 500000) {
            recommendations.push({
                type: 'cost_saving',
                priority: 'high',
                message: 'Biaya energi tinggi. Pertimbangkan strategi penghematan energi.'
            });
        }

        return recommendations;
    }

    // Metode utilitas

    static calculateAverage(values) {
        if (!values?.length) return 0;
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    static calculateTotalEnergy(energyReadings) {
        if (!energyReadings?.length) return 0;
        return energyReadings[energyReadings.length - 1] - energyReadings[0];
    }

    static calculateTimespan(readings) {
        if (!readings?.length) return 0;
        return readings[readings.length - 1].readingTime - readings[0].readingTime;
    }

    static analyzePowerFactor(readings) {
        const powerFactors = readings
            .map(r => r.powerFactor)
            .filter(pf => pf !== null && pf !== undefined);

        return {
            average: this.calculateAverage(powerFactors),
            min: Math.min(...powerFactors),
            max: Math.max(...powerFactors)
        };
    }

    static analyzeFrequencyStability(readings) {
        const frequencies = readings
            .map(r => r.frequency)
            .filter(f => f !== null && f !== undefined);

        return {
            average: this.calculateAverage(frequencies),
            variation: this.calculateVariation(frequencies)
        };
    }

    static analyzeHarmonics(readings) {
        // Implementasi sederhana, bisa diperluas
        return {
            message: 'Analisis harmonik membutuhkan sensor khusus'
        };
    }

    static calculatePerformanceTrends(readings) {
        // Analisis tren sederhana
        const powerTrend = this.calculateLinearTrend(
            readings.map(r => r.power)
        );

        return {
            powerTrend,
            direction: powerTrend > 0 ? 'increasing' : 'decreasing'
        };
    }

    static calculateLinearTrend(values) {
        if (values.length < 2) return 0;
        
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
        const sumXSquare = (n * (n - 1) * (2 * n - 1)) / 6;

        return (n * sumXY - sumX * sumY) / (n * sumXSquare - sumX * sumX);
    }

    static calculateVariation(values) {
        if (!values?.length) return 0;
        const avg = this.calculateAverage(values);
        const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
        return Math.sqrt(this.calculateAverage(squaredDiffs));
    }

    static calculateCarbonEmissions(energyConsumption) {
        return {
            total: energyConsumption * ENERGY_CONSTANTS.CARBON_EMISSION_FACTOR,
            factor: ENERGY_CONSTANTS.CARBON_EMISSION_FACTOR
        };
    }

    static calculatePotentialEnergySavings(baseMetrics, powerLimit) {
        const averagePower = baseMetrics.power.average;
        const excessPower = Math.max(0, averagePower - powerLimit);
        
        return {
            excessPower,
            potentialSavings: excessPower > 0 
                ? (excessPower * baseMetrics.timespan / 3600000) 
                : 0
        };
    }

    static formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Dapatkan daftar tipe layanan yang tersedia
     * @returns {Array} Daftar tipe layanan
     */
    static getAvailableServiceTypes() {
        return Object.keys(ENERGY_CONSTANTS.ELECTRICITY_RATES);
    }

    /**
     * Validasi tipe layanan
     * @param {string} serviceType - Tipe layanan untuk divalidasi
     * @returns {boolean} Apakah tipe layanan valid
     */
    static validateServiceType(serviceType) {
        return Object.keys(ENERGY_CONSTANTS.ELECTRICITY_RATES).includes(serviceType);
    }

    /**
     * Dapatkan tarif dasar untuk tipe layanan
     * @param {string} serviceType - Tipe layanan
     * @returns {number} Tarif dasar
     */
    static getBaseRateForServiceType(serviceType) {
        return ENERGY_CONSTANTS.ELECTRICITY_RATES[serviceType] || 
               ENERGY_CONSTANTS.ELECTRICITY_RATES.R1_900VA;
    }

    /**
     * Simulasi potensi penghematan energi
     * @param {Object} currentMetrics - Metrik penggunaan saat ini
     * @param {Object} optimizationStrategies - Strategi optimasi
     * @returns {Object} Simulasi penghematan
     */
    static simulateEnergySavings(currentMetrics, optimizationStrategies = {}) {
        const strategies = {
            replaceLighting: { savingsPercentage: 0.2 },
            improveInsulation: { savingsPercentage: 0.15 },
            upgradeAppliances: { savingsPercentage: 0.3 },
            optimizePowerFactor: { savingsPercentage: 0.1 },
            ...optimizationStrategies
        };

        const totalPotentialSavings = Object.values(strategies)
            .reduce((total, strategy) => total + strategy.savingsPercentage, 0);

        const currentEnergyCost = currentMetrics.costAnalysis?.costs?.totalCost || 0;

        return {
            currentEnergyConsumption: currentMetrics.baseMetrics?.energy?.total || 0,
            currentEnergyCost,
            strategies: Object.entries(strategies).map(([name, strategy]) => ({
                name,
                savingsPotential: strategy.savingsPercentage * 100
            })),
            totalPotentialSavingPercentage: totalPotentialSavings * 100,
            estimatedAnnualSavings: currentEnergyCost * totalPotentialSavings
        };
    }

    /**
     * Hasilkan laporan komprehensif untuk manajemen energi
     * @param {string} deviceId - ID perangkat
     * @param {Object} timeRange - Rentang waktu
     * @returns {Object} Laporan manajemen energi
     */
    static async generateEnergyManagementReport(deviceId, timeRange) {
        try {
            // Hitung penggunaan komprehensif
            const comprehensiveUsage = await this.calculateComprehensiveUsage(
                deviceId, 
                timeRange
            );

            // Simulasi penghematan
            const savingsSimulation = this.simulateEnergySavings(comprehensiveUsage);

            // Tambahkan ringkasan eksekutif
            const executiveSummary = {
                devicePerformance: {
                    averagePower: comprehensiveUsage.baseMetrics.power.average,
                    totalEnergyConsumption: comprehensiveUsage.baseMetrics.energy.total,
                    totalCost: comprehensiveUsage.costAnalysis.costs.totalCost
                },
                keyInsights: {
                    highestPowerConsumption: comprehensiveUsage.baseMetrics.power.max,
                    lowestPowerConsumption: comprehensiveUsage.baseMetrics.power.min,
                    carbonEmissions: comprehensiveUsage.efficiencyAnalytics.carbonEmissions.total
                },
                savingsPotential: {
                    totalPotentialSavings: savingsSimulation.totalPotentialSavingPercentage,
                    estimatedAnnualSavings: savingsSimulation.estimatedAnnualSavings
                }
            };

            return {
                ...comprehensiveUsage,
                executiveSummary,
                savingsSimulation
            };
        } catch (error) {
            console.error('Gagal membuat laporan manajemen energi:', error);
            throw new Error(`Gagal membuat laporan: ${error.message}`);
        }
    }

    /**
     * Proses prediksi jangka panjang
     * @param {string} deviceId - ID perangkat
     * @param {Object} historicalData - Data historis
     * @returns {Object} Prediksi jangka panjang
     */
    static async createLongTermPrediction(deviceId, historicalData) {
        try {
            // Implementasi prediksi dengan metode statistik sederhana
            const powerConsumption = historicalData.map(data => data.power);
            const energyConsumption = historicalData.map(data => data.energy);

            // Regresi linier sederhana
            const powerTrend = this.calculateLinearTrend(powerConsumption);
            const energyTrend = this.calculateLinearTrend(energyConsumption);

            // Proyeksi untuk periode mendatang
            const projections = {
                nextMonth: {
                    powerConsumption: powerConsumption[powerConsumption.length - 1] + powerTrend,
                    energyConsumption: energyConsumption[energyConsumption.length - 1] + energyTrend
                },
                nextQuarter: {
                    powerConsumption: powerConsumption[powerConsumption.length - 1] + (powerTrend * 3),
                    energyConsumption: energyConsumption[energyConsumption.length - 1] + (energyTrend * 3)
                }
            };

            return {
                deviceId,
                historicalTrends: {
                    powerTrend,
                    energyTrend
                },
                projections,
                confidenceLevel: this.calculatePredictionConfidence(historicalData)
            };
        } catch (error) {
            console.error('Gagal membuat prediksi jangka panjang:', error);
            throw new Error(`Gagal membuat prediksi: ${error.message}`);
        }
    }

    /**
     * Hitung tingkat kepercayaan prediksi
     * @param {Array} historicalData - Data historis
     * @returns {number} Tingkat kepercayaan
     */
    static calculatePredictionConfidence(historicalData) {
        if (historicalData.length < 2) return 0;

        const variations = historicalData.map((data, index) => {
            if (index === 0) return 0;
            return Math.abs(data.power - historicalData[index - 1].power);
        });

        const averageVariation = this.calculateAverage(variations);
        const totalRange = Math.max(...historicalData.map(d => d.power)) - 
                           Math.min(...historicalData.map(d => d.power));

        // Semakin rendah variasi, semakin tinggi kepercayaan
        return Math.max(0, 1 - (averageVariation / totalRange));
    }

    // Konstanta dan metode tambahan
    static get CONSTANTS() {
        return ENERGY_CONSTANTS;
    }
    /**
     * Predict energy consumption based on historical data
     * @param {string} deviceId - Device ID
     * @param {Object} options - Prediction options
     * @returns {Object} Prediction results
     */
    static async predictEnergyConsumption(deviceId, options = {}) {
      const { period = 'monthly', method = 'average' } = options;

      try {
          // Get historical data for the last 30 days
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);

          const readings = await EnergyReading.find({
              deviceId,
              readingTime: {
                  $gte: startDate,
                  $lte: endDate
              }
          }).sort({ readingTime: 1 });

          if (!readings.length) {
              throw new Error('Insufficient historical data for prediction');
          }

          let prediction;
          switch (method) {
              case 'weighted':
                  prediction = this.weightedAveragePrediction(readings);
                  break;
              case 'trend':
                  prediction = this.trendBasedPrediction(readings);
                  break;
              default:
                  prediction = this.simpleAveragePrediction(readings);
          }

          // Calculate confidence level
          const confidenceLevel = this.calculatePredictionConfidence(readings);

          return {
              success: true,
              deviceId,
              predictionMethod: method,
              period,
              confidenceLevel,
              prediction: {
                  ...prediction,
                  timestamp: new Date().toISOString()
              }
          };
      } catch (error) {
          console.error('Prediction error:', error);
          throw new Error(`Failed to generate prediction: ${error.message}`);
      }
  }

  /**
   * Simple average prediction
   * @param {Array} readings - Historical readings
   * @returns {Object} Prediction results
   */
  static simpleAveragePrediction(readings) {
      const energyValues = readings.map(reading => reading.energy);
      const powerValues = readings.map(reading => reading.power);

      const avgEnergy = this.calculateAverage(energyValues);
      const avgPower = this.calculateAverage(powerValues);

      return {
          daily: {
              energy: avgEnergy,
              power: avgPower
          },
          weekly: {
              energy: avgEnergy * 7,
              power: avgPower
          },
          monthly: {
              energy: avgEnergy * 30,
              power: avgPower
          }
      };
  }

  /**
   * Weighted average prediction
   * @param {Array} readings - Historical readings
   * @returns {Object} Prediction results
   */
  static weightedAveragePrediction(readings) {
      const weightedEnergy = readings.map((reading, index) => {
          const weight = (index + 1) / readings.length;
          return reading.energy * weight;
      });

      const weightedPower = readings.map((reading, index) => {
          const weight = (index + 1) / readings.length;
          return reading.power * weight;
      });

      const avgEnergy = this.calculateAverage(weightedEnergy);
      const avgPower = this.calculateAverage(weightedPower);

      return {
          daily: {
              energy: avgEnergy,
              power: avgPower
          },
          weekly: {
              energy: avgEnergy * 7,
              power: avgPower
          },
          monthly: {
              energy: avgEnergy * 30,
              power: avgPower
          }
      };
  }

  /**
   * Trend-based prediction using linear regression
   * @param {Array} readings - Historical readings
   * @returns {Object} Prediction results
   */
  static trendBasedPrediction(readings) {
      const energyTrend = this.calculateLinearTrend(
          readings.map(r => r.energy)
      );
      
      const powerTrend = this.calculateLinearTrend(
          readings.map(r => r.power)
      );

      const lastReading = readings[readings.length - 1];

      return {
          daily: {
              energy: lastReading.energy + energyTrend,
              power: lastReading.power + powerTrend
          },
          weekly: {
              energy: lastReading.energy + (energyTrend * 7),
              power: lastReading.power + (powerTrend * 7)
          },
          monthly: {
              energy: lastReading.energy + (energyTrend * 30),
              power: lastReading.power + (powerTrend * 30)
          },
          trend: {
              energy: energyTrend > 0 ? 'increasing' : 'decreasing',
              power: powerTrend > 0 ? 'increasing' : 'decreasing'
          }
      };
  }

  /**
   * Calculate prediction confidence level
   * @param {Array} readings - Historical readings
   * @returns {number} Confidence level (0-1)
   */
  static calculatePredictionConfidence(readings) {
      if (readings.length < 2) return 0;

      const variations = readings.map((reading, index) => {
          if (index === 0) return 0;
          return Math.abs(reading.power - readings[index - 1].power);
      });

      const avgVariation = this.calculateAverage(variations);
      const maxPower = Math.max(...readings.map(r => r.power));

      // Higher variation = lower confidence
      return Math.max(0, 1 - (avgVariation / maxPower));
  }

/**
 * Calculate peak usage times
 * @param {Array} readings - Energy readings
 * @returns {Object} Peak usage analysis
 */
static analyzePeakUsage(readings) {
  if (!readings?.length) return null;

  const hourlyUsage = new Array(24).fill(0).map(() => ({
      count: 0,
      totalPower: 0,
      maxPower: 0
  }));

  readings.forEach(reading => {
      const hour = new Date(reading.readingTime).getHours();
      hourlyUsage[hour].count++;
      hourlyUsage[hour].totalPower += reading.power;
      hourlyUsage[hour].maxPower = Math.max(
          hourlyUsage[hour].maxPower, 
          reading.power
      );
  });

  // Calculate peak times
  const processedHours = hourlyUsage.map((hour, index) => ({
      hour: index,
      avgPower: hour.count ? hour.totalPower / hour.count : 0,
      maxPower: hour.maxPower,
      readingCount: hour.count
  }));

  // Sort by average power to find peak hours
  const sortedByAvg = [...processedHours].sort((a, b) => b.avgPower - a.avgPower);
  const peakHours = sortedByAvg.slice(0, 3);

  return {
      peakHours: peakHours.map(hour => ({
          hour: hour.hour,
          avgPower: Number(hour.avgPower.toFixed(2)),
          maxPower: Number(hour.maxPower.toFixed(2))
      })),
      recommendations: this.generatePeakUsageRecommendations(peakHours)
  };
}

/**
* Generate peak usage recommendations
* @param {Array} peakHours - Peak usage hours
* @returns {Array} Recommendations
*/
static generatePeakUsageRecommendations(peakHours) {
  const recommendations = [];

  const eveningPeak = peakHours.some(h => h.hour >= 17 && h.hour <= 22);
  const morningPeak = peakHours.some(h => h.hour >= 6 && h.hour <= 9);
  const highPowerUsage = peakHours.some(h => h.avgPower > 2000);

  if (eveningPeak) {
      recommendations.push({
          type: 'peak_shift',
          priority: 'high',
          message: 'Pertimbangkan untuk menggeser penggunaan peralatan tinggi daya di luar jam puncak malam (17:00-22:00)'
      });
  }

  if (morningPeak) {
      recommendations.push({
          type: 'schedule_optimization',
          priority: 'medium',
          message: 'Optimalkan jadwal penggunaan peralatan di pagi hari untuk mengurangi beban puncak'
      });
  }

  if (highPowerUsage) {
      recommendations.push({
          type: 'power_management',
          priority: 'high',
          message: 'Identifikasi dan kelola penggunaan peralatan dengan daya tinggi untuk mengurangi beban puncak'
      });
  }

  return recommendations;
}

/**
* Analyze voltage quality
* @param {Array} readings - Energy readings
* @returns {Object} Voltage quality analysis
*/
static analyzeVoltageQuality(readings) {
  if (!readings?.length) return null;

  const voltages = readings.map(r => r.voltage);
  const { VOLTAGE } = ENERGY_CONSTANTS.POWER_QUALITY_THRESHOLDS;

  const deviations = readings.filter(r => 
      r.voltage < VOLTAGE.MIN || r.voltage > VOLTAGE.MAX
  );

  const criticalDeviations = readings.filter(r => 
      r.voltage < VOLTAGE.CRITICAL_MIN || r.voltage > VOLTAGE.CRITICAL_MAX
  );

  return {
      stats: {
          average: Number(this.calculateAverage(voltages).toFixed(1)),
          min: Math.min(...voltages),
          max: Math.max(...voltages),
          standardDeviation: Number(this.calculateStandardDeviation(voltages).toFixed(2))
      },
      quality: {
          deviationCount: deviations.length,
          criticalDeviationCount: criticalDeviations.length,
          deviationPercentage: Number((deviations.length / readings.length * 100).toFixed(2)),
          stability: this.calculateVoltageStability(voltages)
      },
      recommendations: this.generateVoltageRecommendations(deviations, criticalDeviations)
  };
}

/**
* Calculate voltage stability score
* @param {Array} voltages - Voltage readings
* @returns {Object} Stability analysis
*/
static calculateVoltageStability(voltages) {
  const stdDev = this.calculateStandardDeviation(voltages);
  const variationCoeff = (stdDev / this.calculateAverage(voltages)) * 100;

  let stabilityScore;
  if (variationCoeff < 1) stabilityScore = 'excellent';
  else if (variationCoeff < 2) stabilityScore = 'good';
  else if (variationCoeff < 5) stabilityScore = 'fair';
  else stabilityScore = 'poor';

  return {
      score: stabilityScore,
      variationCoefficient: Number(variationCoeff.toFixed(2))
  };
}

/**
* Generate voltage recommendations
* @param {Array} deviations - Voltage deviations
* @param {Array} criticalDeviations - Critical voltage deviations
* @returns {Array} Recommendations
*/
static generateVoltageRecommendations(deviations, criticalDeviations) {
  const recommendations = [];

  if (criticalDeviations.length > 0) {
      recommendations.push({
          type: 'voltage_critical',
          priority: 'high',
          message: 'Terdeteksi deviasi tegangan kritis. Hubungi teknisi listrik untuk inspeksi segera.'
      });
  }

  if (deviations.length > 0) {
      recommendations.push({
          type: 'voltage_monitor',
          priority: 'medium',
          message: 'Pantau kualitas tegangan secara berkala dan pertimbangkan pemasangan stabilizer'
      });
  }

  return recommendations;
}

/**
* Calculate standard deviation
* @param {Array} values - Numeric values
* @returns {number} Standard deviation
*/
static calculateStandardDeviation(values) {
  const avg = this.calculateAverage(values);
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = this.calculateAverage(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}

/**
* Analyze load distribution
* @param {Array} readings - Energy readings
* @returns {Object} Load distribution analysis
*/
static analyzeLoadDistribution(readings) {
  if (!readings?.length) return null;

  const phases = {
      low: { min: 0, max: 500, count: 0 },
      medium: { min: 500, max: 1500, count: 0 },
      high: { min: 1500, max: Infinity, count: 0 }
  };

  readings.forEach(reading => {
      if (reading.power <= phases.low.max) phases.low.count++;
      else if (reading.power <= phases.medium.max) phases.medium.count++;
      else phases.high.count++;
  });

  const total = readings.length;
  const distribution = {
      low: Number((phases.low.count / total * 100).toFixed(2)),
      medium: Number((phases.medium.count / total * 100).toFixed(2)),
      high: Number((phases.high.count / total * 100).toFixed(2))
  };

  return {
      distribution,
      recommendations: this.generateLoadDistributionRecommendations(distribution)
  };
}

/**
* Generate load distribution recommendations
* @param {Object} distribution - Load distribution percentages
* @returns {Array} Recommendations
*/
static generateLoadDistributionRecommendations(distribution) {
  const recommendations = [];

  if (distribution.high > 30) {
      recommendations.push({
          type: 'load_management',
          priority: 'high',
          message: 'Beban tinggi terlalu sering. Pertimbangkan distribusi beban yang lebih merata'
      });
  }

  if (distribution.low < 20) {
      recommendations.push({
          type: 'efficiency',
          priority: 'medium',
          message: 'Potensi untuk mengoptimalkan penggunaan daya rendah untuk penghematan energi'
      });
  }

  return recommendations;
}
/**
 * Get empty metrics
 */
static getEmptyMetrics() {
  return {
      power: {
          average: 0,
          max: 0,
          min: 0,
          total: 0
      },
      voltage: {
          average: 0,
          max: 0,
          min: 0
      },
      current: {
          average: 0,
          max: 0,
          min: 0
      },
      energy: {
          total: 0,
          start: 0,
          end: 0
      },
      readingCount: 0,
      timespan: 0
  };
}

/**
* Get empty patterns
*/
static getEmptyPatterns() {
  return {
      hourly: Array(24).fill().map((_, hour) => ({
          hour,
          avgPower: 0,
          readingCount: 0
      })),
      daily: Array(7).fill().map((_, day) => ({
          day,
          avgPower: 0,
          readingCount: 0
      }))
  };
}

/**
* Calculate time-of-use metrics
* @param {Array} readings - Energy readings
* @returns {Object} Time-of-use analysis
*/
static calculateTimeOfUseMetrics(readings) {
  if (!readings?.length) return null;

  const timeSlots = {
      peak: { hours: [17, 18, 19, 20, 21, 22], readings: [] },
      offPeak: { hours: [23, 0, 1, 2, 3, 4, 5], readings: [] },
      regular: { hours: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], readings: [] }
  };

  readings.forEach(reading => {
      const hour = new Date(reading.readingTime).getHours();
      if (timeSlots.peak.hours.includes(hour)) {
          timeSlots.peak.readings.push(reading);
      } else if (timeSlots.offPeak.hours.includes(hour)) {
          timeSlots.offPeak.readings.push(reading);
      } else {
          timeSlots.regular.readings.push(reading);
      }
  });

  return {
      peak: {
          avgPower: this.calculateAverage(timeSlots.peak.readings.map(r => r.power)),
          totalEnergy: this.calculateTotalEnergy(timeSlots.peak.readings.map(r => r.energy)),
          readingCount: timeSlots.peak.readings.length
      },
      offPeak: {
          avgPower: this.calculateAverage(timeSlots.offPeak.readings.map(r => r.power)),
          totalEnergy: this.calculateTotalEnergy(timeSlots.offPeak.readings.map(r => r.energy)),
          readingCount: timeSlots.offPeak.readings.length
      },
      regular: {
          avgPower: this.calculateAverage(timeSlots.regular.readings.map(r => r.power)),
          totalEnergy: this.calculateTotalEnergy(timeSlots.regular.readings.map(r => r.energy)),
          readingCount: timeSlots.regular.readings.length
      }
  };
}

/**
* Calculate monthly usage targets
* @param {Object} baseMetrics - Base metrics
* @returns {Object} Usage targets
*/
static calculateUsageTargets(baseMetrics) {
  const avgDailyEnergy = baseMetrics.energy.total / 30; // Assuming 30 days
  const targetReduction = 0.1; // 10% reduction target

  return {
      daily: {
          current: Number(avgDailyEnergy.toFixed(3)),
          target: Number((avgDailyEnergy * (1 - targetReduction)).toFixed(3)),
          reduction: Number((avgDailyEnergy * targetReduction).toFixed(3))
      },
      monthly: {
          current: Number(baseMetrics.energy.total.toFixed(3)),
          target: Number((baseMetrics.energy.total * (1 - targetReduction)).toFixed(3)),
          reduction: Number((baseMetrics.energy.total * targetReduction).toFixed(3))
      }
  };
}

/**
* Calculate cost optimization potential
* @param {Object} costAnalysis - Cost analysis data
* @returns {Object} Cost optimization recommendations
*/
static calculateCostOptimization(costAnalysis) {
  const potentialSavings = {
      peakShift: 0.15,    // 15% potential savings from peak shifting
      efficiency: 0.10,    // 10% from efficiency improvements
      behavioral: 0.05     // 5% from behavioral changes
  };

  const baseCost = costAnalysis.costs.baseEnergyCost;
  let totalSavings = 0;
  const recommendations = [];

  // Calculate peak shifting savings
  const peakShiftSavings = baseCost * potentialSavings.peakShift;
  if (peakShiftSavings > 50000) { // If savings > 50k IDR
      totalSavings += peakShiftSavings;
      recommendations.push({
          type: 'peak_shift',
          savings: Math.round(peakShiftSavings),
          priority: 'high',
          message: 'Geser penggunaan beban tinggi ke jam non-puncak'
      });
  }

  // Calculate efficiency improvement savings
  const efficiencySavings = baseCost * potentialSavings.efficiency;
  if (efficiencySavings > 25000) { // If savings > 25k IDR
      totalSavings += efficiencySavings;
      recommendations.push({
          type: 'efficiency',
          savings: Math.round(efficiencySavings),
          priority: 'medium',
          message: 'Tingkatkan efisiensi penggunaan peralatan'
      });
  }

  // Calculate behavioral change savings
  const behavioralSavings = baseCost * potentialSavings.behavioral;
  totalSavings += behavioralSavings;
  recommendations.push({
      type: 'behavioral',
      savings: Math.round(behavioralSavings),
      priority: 'low',
      message: 'Optimalkan perilaku penggunaan energi'
  });

  return {
      currentCost: Math.round(baseCost),
      potentialSavings: Math.round(totalSavings),
      optimizedCost: Math.round(baseCost - totalSavings),
      savingsPercentage: Number((totalSavings / baseCost * 100).toFixed(1)),
      recommendations: recommendations.sort((a, b) => b.savings - a.savings)
  };
}

/**
* Calculate baseline usage
* @param {Array} historicalReadings - Historical readings
* @returns {Object} Baseline metrics
*/
static calculateBaseline(historicalReadings) {
  if (!historicalReadings?.length) return null;

  const dailyUsage = {};
  
  historicalReadings.forEach(reading => {
      const date = new Date(reading.readingTime).toISOString().split('T')[0];
      if (!dailyUsage[date]) {
          dailyUsage[date] = {
              readings: [],
              totalEnergy: 0,
              maxPower: 0
          };
      }
      dailyUsage[date].readings.push(reading);
      dailyUsage[date].maxPower = Math.max(dailyUsage[date].maxPower, reading.power);
  });

  // Calculate daily statistics
  const dailyStats = Object.values(dailyUsage).map(day => ({
      maxPower: day.maxPower,
      avgPower: this.calculateAverage(day.readings.map(r => r.power)),
      readingCount: day.readings.length
  }));

  return {
      baseline: {
          power: {
              average: Number(this.calculateAverage(dailyStats.map(d => d.avgPower)).toFixed(2)),
              typical: Number(this.calculatePercentile(dailyStats.map(d => d.maxPower), 0.8).toFixed(2))
          },
          patterns: this.analyzeDailyPatterns(dailyStats)
      },
      confidence: this.calculateBaselineConfidence(dailyStats)
  };
}

/**
* Calculate percentile
* @param {Array} values - Array of numbers
* @param {number} percentile - Percentile (0-1)
* @returns {number} Percentile value
*/
static calculatePercentile(values, percentile) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(percentile * (sorted.length - 1));
  return sorted[index];
}

/**
* Analyze daily patterns
* @param {Array} dailyStats - Daily statistics
* @returns {Object} Pattern analysis
*/
static analyzeDailyPatterns(dailyStats) {
  const avgPowers = dailyStats.map(d => d.avgPower);
  const maxPowers = dailyStats.map(d => d.maxPower);

  return {
      variability: {
          daily: Number(this.calculateStandardDeviation(avgPowers).toFixed(2)),
          peak: Number(this.calculateStandardDeviation(maxPowers).toFixed(2))
      },
      trend: this.calculateLinearTrend(avgPowers)
  };
}

/**
* Calculate baseline confidence
* @param {Array} dailyStats - Daily statistics
* @returns {number} Confidence score (0-1)
*/
static calculateBaselineConfidence(dailyStats) {
  const readingCounts = dailyStats.map(d => d.readingCount);
  const avgReadings = this.calculateAverage(readingCounts);
  const coverage = avgReadings / 288; // Ideal: reading every 5 minutes (288/day)

  const powerVariability = this.calculateStandardDeviation(
      dailyStats.map(d => d.avgPower)
  ) / this.calculateAverage(dailyStats.map(d => d.avgPower));

  return Number((Math.min(coverage, 1) * (1 - Math.min(powerVariability, 1))).toFixed(2));
}

}


// Ekspor service
module.exports = EnergyCalculationService;
const EnergyService = require('../services/energyService');
const EnergyCalculationService = require('../services/energyCalculation');
const DeviceService = require('../services/deviceService');
const TimeUtils = require('../utils/timeUtils');
const { sendSuccess, sendError } = require('../utils/responseHandler');

class EnergyController {
  /**
   * Get latest reading
   */
  static async getLatestReading(req, res) {
    try {
      const { deviceId } = req.params;

      const device = await DeviceService.checkDeviceOwnership(deviceId, req.user._id);
      if (!device) {
        return sendError(res, 'Perangkat tidak ditemukan atau akses ditolak', 404);
      }

      const latestReading = await EnergyService.getLatestReading(deviceId);
      if (!latestReading) {
        return sendError(res, 'Tidak ada data pembacaan tersedia', 404);
      }

      return sendSuccess(res, latestReading);
    } catch (error) {
      return sendError(res, `Gagal mengambil pembacaan terbaru: ${error.message}`);
    }
  }

  /**
   * Record new reading
   */
  static async recordReading(req, res) {
    try {
      const { deviceId, timestamp, readings } = req.body;

      if (!deviceId || !readings) {
        return sendError(res, 'ID Perangkat dan data pembacaan wajib diisi', 400);
      }

      const device = await DeviceService.checkDeviceOwnership(deviceId, req.user._id);
      if (!device) {
        return sendError(res, 'Perangkat tidak ditemukan atau akses ditolak', 404);
      }

      const reading = await EnergyService.recordReading({
        deviceId,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        readings
      });

      return sendSuccess(res, reading, 'Pembacaan berhasil dicatat', 201);
    } catch (error) {
      return sendError(res, `Gagal merekam pembacaan: ${error.message}`);
    }
  }

  /**
   * Get usage history
   */
  static async getUsageHistory(req, res) {
    try {
      const { deviceId, period } = req.params;

      const device = await DeviceService.checkDeviceOwnership(deviceId, req.user._id);
      if (!device) {
        return sendError(res, 'Perangkat tidak ditemukan atau akses ditolak', 404);
      }

      const timeRange = TimeUtils.getTimeRange(period);
      const usageHistory = await EnergyService.getUsageHistory(deviceId, timeRange);

      return sendSuccess(res, usageHistory);
    } catch (error) {
      return sendError(res, `Gagal mengambil riwayat penggunaan: ${error.message}`);
    }
  }

  /**
   * Get energy statistics
   */
  static async getEnergyStatistics(req, res) {
    try {
      const { deviceId, period } = req.params;
  
      // Check device ownership
      const device = await DeviceService.checkDeviceOwnership(deviceId, req.user._id);
      if (!device) {
        return sendError(res, 'Perangkat tidak ditemukan atau akses ditolak', 404);
      }
  
      // Get time range 
      const timeRange = TimeUtils.getTimeRange(period);
  
      // Get statistics from energy service instead
      const stats = await EnergyService.getUsageHistory(deviceId, timeRange);
  
      return sendSuccess(res, stats);
    } catch (error) {
      return sendError(res, `Gagal mengambil statistik energi: ${error.message}`);
    }
  }

  /**
   * Get cost analysis
   */
  static async getCostAnalysis(req, res) {
    try {
      const { deviceId, period } = req.params;
  
      // Check device ownership
      const device = await DeviceService.checkDeviceOwnership(deviceId, req.user._id);
      if (!device) {
        return sendError(res, 'Perangkat tidak ditemukan atau akses ditolak', 404);
      }
  
      // Get time range
      const timeRange = TimeUtils.getTimeRange(period);
  
      // Get usage history which includes cost analysis
      const history = await EnergyService.getUsageHistory(deviceId, timeRange);
  
      // Extract cost data
      const costAnalysis = {
        timeRange: history.timeRange,
        costs: history.costs,
        usage: history.summary ? {
          energy: history.summary.totalEnergy,
          averagePower: history.summary.averagePower
        } : null
      };
  
      return sendSuccess(res, costAnalysis);
    } catch (error) {
      return sendError(res, `Gagal menganalisis biaya: ${error.message}`);
    }
  }

  /**
   * Get energy predictions
   */
  static async getPredictions(req, res) {
    try {
      const { deviceId } = req.params;
      const { period = 'monthly', method = 'average' } = req.query;

      const device = await DeviceService.checkDeviceOwnership(deviceId, req.user._id);
      if (!device) {
        return sendError(res, 'Perangkat tidak ditemukan atau akses ditolak', 404);
      }

      const prediction = await EnergyCalculationService.predictEnergyConsumption(deviceId, {
        period,
        method
      });

      return sendSuccess(res, prediction);
    } catch (error) {
      return sendError(res, `Gagal menghasilkan prediksi: ${error.message}`);
    }
  }

  /**
   * Export energy data
   */
  static async exportEnergyData(req, res) {
    try {
      const { deviceId } = req.params;
      const { startDate, endDate, format = 'json' } = req.query;

      const device = await DeviceService.checkDeviceOwnership(deviceId, req.user._id);
      if (!device) {
        return sendError(res, 'Perangkat tidak ditemukan atau akses ditolak', 404);
      }

      const exportedData = await EnergyService.exportEnergyData(deviceId, {
        startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate) : new Date(),
        format
      });

      return sendSuccess(res, exportedData, 'Data berhasil diekspor');
    } catch (error) {
      return sendError(res, `Gagal mengekspor data: ${error.message}`);
    }
  }
}

module.exports = EnergyController;
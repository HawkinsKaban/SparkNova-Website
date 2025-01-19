const DeviceService = require('../services/deviceService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

class DeviceController {
  // Register new device
  static async registerDevice(req, res) {
    try {
      const device = await DeviceService.registerDevice(req.user._id, req.body);
      return sendSuccess(res, device, 'Device berhasil didaftarkan', 201);
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Get all devices for user
  static async getAllDevices(req, res) {
    try {
      const devices = await DeviceService.getAllUserDevices(req.user._id);
      return sendSuccess(res, devices);
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Get single device
  static async getDevice(req, res) {
    try {
      const device = await DeviceService.checkDeviceOwnership(
        req.params.deviceId,
        req.user._id
      );
      if (!device) {
        return sendError(res, 'Device tidak ditemukan atau tidak memiliki akses', 404);
      }
      return sendSuccess(res, device);
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Update device settings
  static async updateDevice(req, res) {
    try {
      const updatedDevice = await DeviceService.updateDeviceConfig(
        req.params.deviceId,
        req.user._id,
        req.body
      );
      return sendSuccess(res, updatedDevice, 'Device berhasil diupdate');
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Control device relay
  static async controlRelay(req, res) {
    try {
      const { state } = req.body;
      const device = await DeviceService.controlRelay(
        req.params.deviceId,
        req.user._id,
        state
      );
      return sendSuccess(res, device, `Relay berhasil ${state ? 'dinyalakan' : 'dimatikan'}`);
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Get device health status
  static async getDeviceHealth(req, res) {
    try {
      const health = await DeviceService.getDeviceHealth(
        req.params.deviceId,
        req.user._id
      );
      return sendSuccess(res, health);
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Get device uptime history
  static async getUptimeHistory(req, res) {
    try {
      const { deviceId } = req.params;
      const { days = 7 } = req.query;

      const device = await DeviceService.checkDeviceOwnership(deviceId, req.user._id);
      if (!device) {
        return sendError(res, 'Device tidak ditemukan atau tidak memiliki akses', 404);
      }

      const uptimeHistory = await DeviceService.getUptimeHistory(deviceId, parseInt(days));
      return sendSuccess(res, uptimeHistory);
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Get device configuration
  static async getDeviceConfig(req, res) {
    try {
      const device = await DeviceService.checkDeviceOwnership(
        req.params.deviceId,
        req.user._id
      );
      if (!device) {
        return sendError(res, 'Device tidak ditemukan atau tidak memiliki akses', 404);
      }

      return sendSuccess(res, {
        powerLimit: device.config.powerLimit,
        currentLimit: device.config.currentLimit,
        warningThreshold: device.config.warningThreshold,
        serviceType: device.config.serviceType
      });
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Update device configuration
  static async updateDeviceConfig(req, res) {
    try {
      const updatedDevice = await DeviceService.updateDeviceConfig(
        req.params.deviceId,
        req.user._id,
        req.body
      );
      return sendSuccess(res, updatedDevice, 'Konfigurasi device berhasil diupdate');
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Delete device
  static async deleteDevice(req, res) {
    try {
      await DeviceService.deleteDevice(req.params.deviceId, req.user._id);
      return sendSuccess(res, null, 'Device berhasil dihapus');
    } catch (error) {
      return sendError(res, error.message);
    }
  }
}

module.exports = DeviceController;
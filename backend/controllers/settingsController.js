const { DeviceSettings } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const DeviceService = require('../services/deviceService');

class SettingsController {
  static async getSettings(req, res) {
    try {
      const { deviceId } = req.params;

      const device = await DeviceService.checkDeviceOwnership(
        deviceId,
        req.user._id
      );

      if (!device) {
        return sendError(res, 'Device tidak ditemukan', 404);
      }

      const settings = await DeviceSettings.findOne({ deviceId });
      if (!settings) {
        return sendError(res, 'Pengaturan device tidak ditemukan', 404);
      }

      return sendSuccess(res, settings);
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  static async updateSettings(req, res) {
    try {
      const { deviceId } = req.params;
      const {
        serviceType,
        powerLimit,
        warningPercentage,
        taxRate,
        wifiSSID,
        wifiPassword
      } = req.body;

      const device = await DeviceService.checkDeviceOwnership(
        deviceId,
        req.user._id
      );

      if (!device) {
        return sendError(res, 'Device tidak ditemukan', 404);
      }

      // Update settings
      const settings = await DeviceSettings.findOneAndUpdate(
        { deviceId },
        {
          serviceType,
          powerLimit,
          warningPercentage,
          taxRate,
          ...(wifiSSID && { wifiSSID }),
          ...(wifiPassword && { wifiPassword })
        },
        {
          new: true,
          runValidators: true
        }
      );

      if (!settings) {
        return sendError(res, 'Pengaturan device tidak ditemukan', 404);
      }

      // Update device status
      await DeviceService.updateDeviceStatus(deviceId, 'configuring');

      return sendSuccess(res, settings, 'Pengaturan berhasil diperbarui');
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  static async resetToDefault(req, res) {
    try {
      const { deviceId } = req.params;

      const device = await DeviceService.checkDeviceOwnership(
        deviceId,
        req.user._id
      );

      if (!device) {
        return sendError(res, 'Device tidak ditemukan', 404);
      }

      const defaultSettings = {
        serviceType: 'R1_900VA',
        powerLimit: 1000.00,
        warningPercentage: 80.00,
        taxRate: 5.00
      };

      const settings = await DeviceSettings.findOneAndUpdate(
        { deviceId },
        defaultSettings,
        { new: true, runValidators: true }
      );

      return sendSuccess(
        res,
        settings,
        'Pengaturan berhasil direset ke default'
      );
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  static async updateWifiConfig(req, res) {
    try {
      const { deviceId } = req.params;
      const { wifiSSID, wifiPassword } = req.body;

      const device = await DeviceService.checkDeviceOwnership(
        deviceId,
        req.user._id
      );

      if (!device) {
        return sendError(res, 'Device tidak ditemukan', 404);
      }

      const settings = await DeviceSettings.findOneAndUpdate(
        { deviceId },
        { wifiSSID, wifiPassword },
        { new: true }
      );

      // Update device status
      await DeviceService.updateDeviceStatus(
        deviceId,
        'configuring',
        { lastConnection: new Date() }
      );

      return sendSuccess(res, {
        wifiSSID: settings.wifiSSID,
        status: 'configuring'
      }, 'Konfigurasi WiFi berhasil diperbarui');
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  static async getConfigurationHistory(req, res) {
    try {
      const { deviceId } = req.params;

      const device = await DeviceService.checkDeviceOwnership(
        deviceId,
        req.user._id
      );

      if (!device) {
        return sendError(res, 'Device tidak ditemukan', 404);
      }

      const settings = await DeviceSettings.findOne({ deviceId })
        .select('serviceType powerLimit warningPercentage taxRate updatedAt');

      return sendSuccess(res, {
        currentSettings: settings,
        lastUpdate: settings.updatedAt
      });
    } catch (error) {
      return sendError(res, error.message);
    }
  }
}

module.exports = SettingsController;
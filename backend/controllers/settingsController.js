// controllers/settingsController.js
const { DeviceSettings, Device } = require('../models');

exports.getSettings = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({
      deviceId,
      userId: req.user._id
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    const settings = await DeviceSettings.findOne({ deviceId });
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Device settings not found'
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateSettings = async (req, res) => {
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

      // Check device ownership
      const device = await Device.findOne({
        deviceId,
        userId: req.user._id
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      // Update settings
      const updatedSettings = await DeviceSettings.findOneAndUpdate(
        { deviceId },
        {
          serviceType,
          powerLimit,
          warningPercentage,
          taxRate,
          wifiSSID,
          wifiPassword
        },
        { 
          new: true,
          runValidators: true 
        }
      );

      if (!updatedSettings) {
        return res.status(404).json({
          success: false,
          message: 'Device settings not found'
        });
      }

      // Update device status to 'configuring'
      await Device.findOneAndUpdate(
        { deviceId },
        { status: 'configuring' }
      );

      res.json({
        success: true,
        data: updatedSettings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
};

exports.resetToDefault = async (req, res) => {
    try {
      const { deviceId } = req.params;

      // Check device ownership
      const device = await Device.findOne({
        deviceId,
        userId: req.user._id
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      // Reset to default settings
      const defaultSettings = {
        serviceType: 'R1_900VA',
        powerLimit: 1000.00,
        warningPercentage: 80.00,
        taxRate: 5.00
      };

      const updatedSettings = await DeviceSettings.findOneAndUpdate(
        { deviceId },
        defaultSettings,
        { 
          new: true,
          runValidators: true 
        }
      );

      res.json({
        success: true,
        message: 'Settings reset to default successfully',
        data: updatedSettings
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
};

exports.updateWifiConfig = async (req, res) => {
    try {
      const { deviceId } = req.params;
      const { wifiSSID, wifiPassword } = req.body;

      // Check device ownership
      const device = await Device.findOne({
        deviceId,
        userId: req.user._id
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      // Update WiFi configuration
      const updatedSettings = await DeviceSettings.findOneAndUpdate(
        { deviceId },
        { wifiSSID, wifiPassword },
        { new: true }
      );

      // Update device status
      await Device.findOneAndUpdate(
        { deviceId },
        { 
          status: 'configuring',
          lastConnection: new Date()
        }
      );

      res.json({
        success: true,
        message: 'WiFi configuration updated successfully',
        data: {
          wifiSSID: updatedSettings.wifiSSID,
          status: 'configuring'
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
};

exports.getConfigurationHistory = async (req, res) => {
    try {
      const { deviceId } = req.params;

      // Check device ownership
      const device = await Device.findOne({
        deviceId,
        userId: req.user._id
      });

      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Device not found'
        });
      }

      // Get settings history (using schema timestamps)
      const settings = await DeviceSettings.findOne({ deviceId })
        .select('serviceType powerLimit warningPercentage taxRate updatedAt');

      res.json({
        success: true,
        data: {
          currentSettings: settings,
          lastUpdate: settings.updatedAt
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
};
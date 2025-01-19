const mongoose = require('mongoose');
const { Device, Alert, DeviceSettings, DeviceStatusLog } = require('../models');
const mqttService = require('./mqttService');

class DeviceService {
  /**
   * Device Registration and Management
   */
  static async registerDevice(userId, deviceData) {
    try {
      // Check if device already exists
      const existingDevice = await Device.findOne({ deviceId: deviceData.deviceId });
      if (existingDevice) {
        throw new Error('Device ID sudah terdaftar');
      }

      // Create device with default configuration
      const device = await Device.create({
        ...deviceData,
        userId,
        status: 'configuring',
        config: {
          powerLimit: deviceData.powerLimit || 2200,
          currentLimit: deviceData.currentLimit || 10,
          warningThreshold: deviceData.warningThreshold || 90
        }
      });

      // Create default device settings
      await DeviceSettings.create({
        deviceId: device.deviceId,
        serviceType: deviceData.serviceType || 'R1_900VA',
        powerLimit: device.config.powerLimit,
        warningPercentage: device.config.warningThreshold,
        taxRate: 5.00
      });

      // Log initial status
      await DeviceStatusLog.create({
        deviceId: device.deviceId,
        status: 'connected',
        reason: 'startup',
        timestamp: new Date()
      });

      return device;
    } catch (error) {
      throw new Error(`Error mendaftarkan device: ${error.message}`);
    }
  }

  /**
   * Device Ownership and Access Control
   */
  static async checkDeviceOwnership(deviceId, userId) {
    try {
      const device = await Device.findOne({ deviceId, userId });
      return device;
    } catch (error) {
      throw new Error(`Error memeriksa kepemilikan device: ${error.message}`);
    }
  }

  static async getAllUserDevices(userId) {
    try {
      const devices = await Device.find({ userId })
        .select('-__v')
        .sort({ createdAt: -1 });
      return devices;
    } catch (error) {
      throw new Error(`Error mengambil data device: ${error.message}`);
    }
  }

  /**
   * Device Status Management
   */
  static async updateDeviceStatus(deviceId, status, metadata = {}) {
    try {
      const device = await Device.findOneAndUpdate(
        { deviceId },
        { 
          status,
          lastConnection: new Date(),
          ...metadata
        },
        { new: true }
      );

      if (!device) {
        throw new Error('Device tidak ditemukan');
      }

      // Log status change
      await DeviceStatusLog.create({
        deviceId,
        status,
        reason: metadata.reason || 'manual',
        timestamp: new Date(),
        details: {
          ...metadata,
          ipAddress: metadata.ipAddress,
          rssi: metadata.rssi
        }
      });

      return device;
    } catch (error) {
      throw new Error(`Error mengupdate status device: ${error.message}`);
    }
  }

  /**
   * Device Settings Management
   */
  static async getDeviceSettings(deviceId) {
    try {
      const device = await Device.findOne({ deviceId });
      if (!device) {
        throw new Error('Device tidak ditemukan');
      }

      const settings = await DeviceSettings.findOne({ deviceId });
      
      return {
        powerLimit: device.config.powerLimit || 2200,
        currentLimit: device.config.currentLimit || 10,
        warningThreshold: device.config.warningThreshold || 90,
        serviceType: settings?.serviceType || 'R1_900VA',
        taxRate: settings?.taxRate || 5
      };
    } catch (error) {
      throw new Error(`Error mengambil pengaturan device: ${error.message}`);
    }
  }

  static async updateDeviceConfig(deviceId, userId, config) {
    try {
      // Validate ownership
      const device = await this.checkDeviceOwnership(deviceId, userId);
      if (!device) {
        throw new Error('Device tidak ditemukan atau tidak memiliki akses');
      }

      // Validate configuration values
      this.validateDeviceConfig(config);

      // Update device configuration
      const updatedDevice = await Device.findOneAndUpdate(
        { deviceId, userId },
        { 
          $set: {
            ...(config.name && { name: config.name }),
            'config.powerLimit': config.powerLimit || device.config.powerLimit,
            'config.currentLimit': config.currentLimit || device.config.currentLimit,
            'config.warningThreshold': config.warningThreshold || device.config.warningThreshold,
            status: 'configuring'
          }
        },
        { new: true }
      );

      // Update device settings if needed
      if (config.serviceType || config.taxRate) {
        await DeviceSettings.findOneAndUpdate(
          { deviceId },
          { 
            $set: {
              ...(config.serviceType && { serviceType: config.serviceType }),
              ...(config.taxRate && { taxRate: config.taxRate })
            }
          },
          { upsert: true }
        );
      }

      // Send configuration to device via MQTT
      await mqttService.sendCommand(deviceId, {
        update_config: {
          powerLimit: updatedDevice.config.powerLimit,
          currentLimit: updatedDevice.config.currentLimit,
          warningThreshold: updatedDevice.config.warningThreshold
        }
      });

      return updatedDevice;
    } catch (error) {
      throw new Error(`Error mengupdate konfigurasi device: ${error.message}`);
    }
  }

  /**
   * Device Control
   */
  static async controlRelay(deviceId, userId, state) {
    try {
      // Pre-validation
      const device = await Device.findOne({ deviceId, userId });
      if (!device) {
        throw new Error('Device tidak ditemukan atau tidak memiliki akses');
      }

      if (!mqttService.isConnected) {
        throw new Error('Layanan MQTT tidak tersedia');
      }

      // Send MQTT command first
      const relayState = Boolean(state);
      const commandResult = await this.sendRelayCommand(deviceId, relayState);
      
      if (!commandResult.success) {
        throw new Error(`Gagal mengirim perintah: ${commandResult.error}`);
      }

      // Update device state in database
      const updatedDevice = await Device.findOneAndUpdate(
        { deviceId },
        { 
          relayState,
          lastConnection: new Date(),
          status: 'connected'
        },
        { new: true }
      );

      if (!updatedDevice) {
        throw new Error('Gagal mengupdate status device');
      }

      return {
        success: true,
        message: `Relay berhasil ${relayState ? 'dinyalakan' : 'dimatikan'}`,
        data: {
          deviceId: updatedDevice.deviceId,
          relayState: updatedDevice.relayState,
          status: updatedDevice.status,
          lastConnection: updatedDevice.lastConnection
        }
      };

    } catch (error) {
      console.error('Relay Control Error:', {
        deviceId,
        targetState: state,
        error: error.message
      });

      throw new Error(`Error mengontrol relay: ${error.message}`);
    }
  }

  static async sendRelayCommand(deviceId, state) {
    const maxRetries = 2;
    const timeout = 2000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          mqttService.sendCommand(deviceId, {
            set_relay: state,
            timestamp: Date.now(),
            attempt
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Command timeout')), timeout)
          )
        ]);

        // Wait briefly for device acknowledgment
        await new Promise(resolve => setTimeout(resolve, 500));

        return { success: true, result, attempt };
      } catch (error) {
        if (attempt === maxRetries) {
          return { 
            success: false, 
            error: 'Gagal mengirim perintah ke device',
            attempts: attempt
          };
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }


  /**
   * Monitor relay state
   */
  static async monitorRelayState(deviceId) {
    try {
      const device = await Device.findOne({ deviceId });
      if (!device) return null;

      const lastHour = new Date(Date.now() - 60 * 60 * 1000);
      
      const stateChanges = await DeviceStatusLog.find({
        deviceId,
        timestamp: { $gte: lastHour },
        'details.action': 'relay_switch'
      }).sort({ timestamp: -1 });

      const lastChange = stateChanges[0];
      
      return {
        currentState: device.relayState,
        lastChangeTimestamp: lastChange?.timestamp,
        changeCount: stateChanges.length,
        isStable: stateChanges.length < 10, // Flag if too many changes
        lastChangeBy: lastChange?.details?.userId || 'system'
      };
    } catch (error) {
      console.error('Error monitoring relay state:', error);
      return null;
    }
  }

  /**
   * Device Health Monitoring
   */
  static async getDeviceHealth(deviceId, userId) {
    try {
      const device = await this.checkDeviceOwnership(deviceId, userId);
      if (!device) {
        throw new Error('Device tidak ditemukan atau tidak memiliki akses');
      }

      const lastHour = new Date();
      lastHour.setHours(lastHour.getHours() - 1);

      const [recentAlerts, connectionStatus] = await Promise.all([
        Alert.find({
          deviceId,
          createdAt: { $gte: lastHour }
        }).sort({ createdAt: -1 }),
        this.checkConnectionStatus(device)
      ]);

      return {
        status: device.status,
        lastConnection: device.lastConnection,
        connectionQuality: connectionStatus.quality,
        recentAlerts: recentAlerts.length,
        firmware: device.firmware,
        uptime: this.calculateUptime(device),
        health: {
          status: this.determineHealthStatus(device, recentAlerts),
          issues: this.identifyIssues(device, recentAlerts, connectionStatus)
        }
      };
    } catch (error) {
      throw new Error(`Error mendapatkan status kesehatan device: ${error.message}`);
    }
  }

  /**
   * Helper Methods
   */
  static validateDeviceConfig(config) {
    if (config.powerLimit && (config.powerLimit < 100 || config.powerLimit > 5000)) {
      throw new Error('Power limit harus antara 100W dan 5000W');
    }

    if (config.currentLimit && (config.currentLimit < 1 || config.currentLimit > 20)) {
      throw new Error('Current limit harus antara 1A dan 20A');
    }

    if (config.warningThreshold && (config.warningThreshold < 50 || config.warningThreshold > 95)) {
      throw new Error('Warning threshold harus antara 50% dan 95%');
    }

    if (config.taxRate && (config.taxRate < 0 || config.taxRate > 100)) {
      throw new Error('Tax rate harus antara 0% dan 100%');
    }
  }

  static checkConnectionStatus(device) {
    const lastConnection = new Date(device.lastConnection);
    const timeDiff = Date.now() - lastConnection;
    
    let quality = 'good';
    if (timeDiff > 300000) { // 5 menit
      quality = 'poor';
    } else if (timeDiff > 60000) { // 1 menit
      quality = 'fair';
    }

    return {
      quality,
      lastConnectionAge: Math.floor(timeDiff / 1000) // dalam detik
    };
  }

  static calculateUptime(device) {
    if (!device.lastConnection) return 0;
    
    const now = new Date();
    const lastConnection = new Date(device.lastConnection);
    const uptime = now - lastConnection;
    
    return Math.floor(uptime / 1000); // return dalam detik
  }

  static determineHealthStatus(device, recentAlerts) {
    if (device.status === 'disconnected') return 'offline';
    if (recentAlerts.length > 5) return 'critical';
    if (recentAlerts.length > 2) return 'warning';
    return 'healthy';
  }

  static identifyIssues(device, recentAlerts, connectionStatus) {
    const issues = [];

    if (connectionStatus.quality !== 'good') {
      issues.push(`Kualitas koneksi: ${connectionStatus.quality}`);
    }

    if (recentAlerts.length > 0) {
      issues.push(`${recentAlerts.length} alert dalam 1 jam terakhir`);
    }

    if (device.status === 'disconnected') {
      issues.push('Device terputus dari jaringan');
    }

    return issues;
  }
}

module.exports = DeviceService;
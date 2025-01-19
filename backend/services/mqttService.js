const mqtt = require('mqtt');
const mongoose = require('mongoose');
const { 
  EnergyReading, 
  Device, 
  Alert, 
  DeviceSettings,
  DeviceStatusLog 
} = require('../models');

class MQTTService {
  constructor() {
    // Core service properties
    this.client = null;
    this.isConnected = false;
    this.connectionPromise = null;
    this.reconnectTimeout = null;
    this.initialized = false;
    
    // Status tracking
    this.syncScheduled = false;
    this.lastDeviceStatus = new Map();
    this.lastStatusUpdate = new Map();
    this.lastProcessedMessage = null;
    
    // Configuration
    this.messageDebounceTime = 1000;
    this.statusDebounceTime = 2000;
    this.topics = {
      data: 'sparknova/powerdata',
      status: 'sparknova/status',
      logs: 'sparknova/logs',
      control: 'sparknova/control'
    };

    // Clear message cache periodically
    setInterval(() => {
      this.lastProcessedMessage = null;
      this.lastStatusUpdate.clear();
    }, 60000);
  }

  // Time Management Methods
  getWIBTime(date = new Date()) {
    const utcTime = date instanceof Date ? date : new Date(date);
    return new Date(utcTime.getTime() + (7 * 60 * 60 * 1000));
  }

  formatWIBTime(date) {
    const wibTime = this.getWIBTime(date);
    return wibTime.toLocaleString('en-US', { 
      timeZone: 'Asia/Jakarta',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Service Initialization
  async init() {
    try {
      await this.connect();
      this.initialized = true;
      console.log('✅ MQTT Service initialized');
      await this.syncDeviceTime();
      this.scheduleTimeSync();
      
      // Setup reconnection check
      setInterval(() => {
        if (!this.isConnected) {
          this.connect().catch(console.error);
        }
      }, 5 * 60 * 1000);
  
      return true;
    } catch (error) {
      console.error('Error initializing MQTT service:', error);
      this.initialized = false;
      throw error;
    }
  }

  // Connection Management
  async connect() {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      if (!this.connectionPromise) {
        this.connectionPromise = new Promise((resolve, reject) => {
          const options = {
            host: process.env.MQTT_HOST,
            port: parseInt(process.env.MQTT_PORT),
            protocol: 'mqtts',
            username: process.env.MQTT_USERNAME,
            password: process.env.MQTT_PASSWORD,
            clientId: `sparknova_backend_${Math.random().toString(16).slice(2, 8)}`,
            keepalive: 60,
            reconnectPeriod: 5000,
            connectTimeout: 30000,
            clean: true,
            qos: 2
          };

          console.log('Connecting to MQTT broker...');
          this.client = mqtt.connect(options);
          this.setupClientListeners(resolve, reject);
        });
      }

      await this.connectionPromise;
      return true;
    } catch (error) {
      console.error('MQTT Connection Error:', error);
      this.scheduleReconnect();
      throw error;
    }
  }

  setupClientListeners(resolve, reject) {
    this.client.on('connect', () => {
      console.log('✅ MQTT Connected successfully');
      this.isConnected = true;
      this.subscribe();
      resolve(true);
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT Error:', error);
      this.isConnected = false;
      reject(error);
    });

    this.client.on('close', () => {
      console.log('MQTT Connection closed');
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.client.on('offline', () => {
      console.log('MQTT Client offline');
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.client.on('message', this.handleMessage.bind(this));
  }

  scheduleReconnect() {
    if (!this.reconnectTimeout) {
      console.log('Scheduling MQTT reconnection...');
      this.reconnectTimeout = setTimeout(() => {
        this.connectionPromise = null;
        this.connect().catch(console.error);
      }, 5000);
    }
  }

  // Topic Subscription
  subscribe() {
    if (!this.isConnected || !this.client) {
      console.warn('Cannot subscribe: MQTT client not connected');
      return;
    }

    Object.values(this.topics).forEach(topic => {
      this.client.subscribe(topic, { qos: 2 }, (err) => {
        if (err) {
          console.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`✅ Subscribed to ${topic}`);
        }
      });
    });
  }

  // Message Handling
  async handleMessage(topic, message) {
    try {
      const data = JSON.parse(message.toString());
      console.log(`Received message on ${topic}:`, message.toString());
      
      switch (topic) {
        case this.topics.data:
          await this.handlePowerData(data);
          break;
        case this.topics.status:
          await this.handleDeviceStatus(data);
          break;
        case this.topics.logs:
          await this.handleDeviceLogs(data);
          break;
      }
    } catch (error) {
      console.error('Error handling MQTT message:', error);
    }
  }

  // Data Validation
  validateData(data) {
    try {
      // Special case for relay control messages
      if (data.relay_status !== undefined && data.source === 'button') {
        return true;
      }

      if (!data || !data.deviceId) {
        throw new Error('Missing deviceId');
      }

      if (typeof data.power_connected === 'undefined') {
        throw new Error('Missing power_connected status');
      }

      if (!data.power_connected) {
        return true;
      }

      const fields = ['voltage', 'current', 'power', 'energy'];
      for (const field of fields) {
        if (!(field in data)) {
          throw new Error(`Missing required field: ${field}`);
        }

        const value = parseFloat(data[field]);
        if (isNaN(value)) {
          throw new Error(`Invalid ${field} value: ${data[field]}`);
        }

        if (value < 0) {
          throw new Error(`Negative ${field} value: ${value}`);
        }
      }

      return true;
    } catch (error) {
      console.error('Data validation error:', error.message);
      console.error('Data:', JSON.stringify(data, null, 2));
      return false;
    }
  }

 /**
   * Handle power data messages
   */
 async handlePowerData(data) {
  try {
    // Special handling for relay control messages
    if (data.relay_status !== undefined && data.source === 'button') {
      await this.handleDeviceStatus({
        deviceId: 'SN001',
        relay_status: data.relay_status,
        timestamp: data.timestamp,
        source: 'button'
      });
      return;
    }

    if (!this.validateData(data)) {
      return;
    }

    const wibTime = this.getWIBTime();
    
    // Create energy reading
    const reading = await this.createEnergyReading(data, wibTime);
    if (!reading) return;

    // Update device status
    const device = await this.updateDeviceStatus(data, wibTime);
    if (!device) return;

    // Check for alerts if needed
    await this.checkPowerAlerts(data, device);

    console.log('Energy reading recorded:', {
      deviceId: data.deviceId,
      readingTime: this.formatWIBTime(wibTime),
      powerConnected: data.power_connected,
      values: {
        voltage: reading.voltage,
        current: reading.current,
        power: reading.power,
        energy: reading.energy
      }
    });

  } catch (error) {
    console.error('Error handling power data:', error);
    console.error('Raw data:', JSON.stringify(data, null, 2));
  }
}


  // Database Operations
  async createEnergyReading(data, timestamp) {
    try {
      return await EnergyReading.create({
        deviceId: data.deviceId,
        readingTime: timestamp,
        voltage: data.power_connected ? parseFloat(data.voltage) : 0,
        current: data.power_connected ? parseFloat(data.current) : 0,
        power: data.power_connected ? parseFloat(data.power) : 0,
        energy: data.power_connected ? parseFloat(data.energy) : 0,
        frequency: data.power_connected && data.frequency ? parseFloat(data.frequency) : null,
        powerFactor: data.power_connected && data.pf ? parseFloat(data.pf) : null,
        powerConnected: data.power_connected
      });
    } catch (error) {
      console.error('Error creating energy reading:', error);
      return null;
    }
  }

  async updateDeviceStatus(data, timestamp) {
    try {
      return await Device.findOneAndUpdate(
        { deviceId: data.deviceId },
        { 
          lastConnection: timestamp,
          status: data.relay_status ? 'connected' : 'disconnected',
          relayState: data.relay_status,
          powerConnected: data.power_connected
        },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating device status:', error);
      return null;
    }
  }

  // Alert Handling
  async checkPowerAlerts(data, device) {
    try {
      const settings = await DeviceSettings.findOne({ deviceId: data.deviceId });
      if (!settings) return;

      const power = parseFloat(data.power);
      const powerLimit = settings.powerLimit;
      const warningThreshold = powerLimit * (settings.warningPercentage / 100);

      if (power > powerLimit) {
        await Alert.create({
          deviceId: data.deviceId,
          type: 'critical',
          message: `Power usage (${power}W) exceeds limit (${powerLimit}W)`
        });
      } else if (power > warningThreshold) {
        await Alert.create({
          deviceId: data.deviceId,
          type: 'warning',
          message: `Power usage (${power}W) above warning threshold (${warningThreshold}W)`
        });
      }
    } catch (error) {
      console.error('Error checking power alerts:', error);
    }
  }

 /**
   * Handle device status updates
   */
 async handleDeviceStatus(data) {
  try {
    // Handle global status updates
    if (data.status && !data.deviceId) {
      console.log('Global status update:', data);
      return;
    }

    // Handle device specific status
    if (!data.deviceId) {
      console.error('Missing deviceId in status update');
      return;
    }

    const wibTime = this.getWIBTime();
    const wasOffline = !this.lastDeviceStatus.get(data.deviceId);
    
    // Update device status cache
    this.lastDeviceStatus.set(data.deviceId, data.status || 'unknown');

    // Prepare update data
    const updateData = {
      lastConnection: wibTime,
      ...(data.status && { status: data.status }),
      ...(data.relay_status !== undefined && { 
        relayState: !!data.relay_status,
        status: data.relay_status ? 'connected' : 'disconnected'
      }),
      ...(data.power_connected !== undefined && { 
        powerConnected: data.power_connected 
      })
    };

    try {
      // Update device in database
      const device = await Device.findOneAndUpdate(
        { deviceId: data.deviceId },
        { $set: updateData },
        { new: true }
      );

      if (!device) {
        console.error(`Device not found: ${data.deviceId}`);
        return;
      }

      // Only create log if status has changed
      if (device.status !== this.lastDeviceStatus.get(data.deviceId)) {
        try {
          await DeviceStatusLog.create({
            deviceId: data.deviceId,
            timestamp: wibTime,
            status: device.status,
            reason: data.type || 'status_update',
            details: {
              source: data.source || 'mqtt',
              relayState: device.relayState,
              powerConnected: device.powerConnected,
              previousStatus: this.lastDeviceStatus.get(data.deviceId),
              ...(data.source === 'button' && { actionType: 'manual_control' })
            }
          });
        } catch (logError) {
          console.error('Error creating status log:', logError);
        }
      }

      console.log(`Device ${data.deviceId} status updated:`, {
        status: device.status,
        relayState: device.relayState,
        powerConnected: device.powerConnected,
        timestamp: this.formatWIBTime(wibTime),
        source: data.source || 'mqtt'
      });

      // Handle time sync for reconnected devices
      if (wasOffline && device.status === 'connected') {
        console.log(`Device ${data.deviceId} came online, syncing time`);
        await this.syncDeviceTime();
      }

    } catch (dbError) {
      console.error('Database error in status update:', dbError);
    }

  } catch (error) {
    console.error('Error handling device status:', error);
  }
}


  // Log Handling
  async handleDeviceLogs(data) {
    try {
      if (!data.deviceId) {
        console.error('Invalid log data:', data);
        return;
      }

      console.log('Device Log:', {
        ...data,
        timestamp: this.formatWIBTime(new Date())
      });

      if (data.error || data.warning) {
        await Alert.create({
          deviceId: data.deviceId,
          type: data.error ? 'critical' : 'warning',
          message: data.message || 'Device reported an issue'
        });
      }
    } catch (error) {
      console.error('Error handling device logs:', error);
    }
  }

  // Time Sync Methods
  async syncDeviceTime() {
    try {
      if (!this.isConnected) {
        console.warn('Cannot sync time: MQTT not connected');
        return;
      }

      const wibTime = this.getWIBTime();
      const timeStr = this.formatWIBTime(wibTime)
        .replace(',', '')
        .replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$1-$2');

      const command = {
        sync_time: timeStr,
        timestamp: wibTime.getTime(),
        timezone: 'Asia/Jakarta'
      };

      await this.sendCommand('SN001', command);
      console.log('Time sync sent:', {
        formattedTime: timeStr,
        timestamp: wibTime.getTime(),
        localTime: this.formatWIBTime(wibTime)
      });

      await this.verifyTimeSync();
    } catch (error) {
      console.error('Error syncing device time:', error);
    }
  }

  async verifyTimeSync() {
    setTimeout(async () => {
      try {
        const latestReading = await EnergyReading.findOne({ 
          deviceId: 'SN001' 
        }).sort({ readingTime: -1 });
        
        if (latestReading) {
          const verifyTime = this.getWIBTime(latestReading.readingTime);
          const currentTime = this.getWIBTime();
          const timeDiff = Math.abs(currentTime - verifyTime) / (1000 * 60);
          
          console.log('Time sync verification:', {
            deviceTime: this.formatWIBTime(verifyTime),
            currentTime: this.formatWIBTime(currentTime),
            timeDifference: `${timeDiff.toFixed(2)} minutes`
          });

          if (timeDiff > 5) {
            await Alert.create({
              deviceId: 'SN001',
              type: 'warning',
              message: `Device time drift detected: ${timeDiff.toFixed(2)} minutes`
            });
          }
        }
      } catch (error) {
        console.error('Error verifying time sync:', error);
      }
    }, 10000);
  }

  scheduleTimeSync() {
    if (this.syncScheduled) return;

    const scheduleNextSync = () => {
      const now = this.getWIBTime();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const timeUntilNextSync = tomorrow.getTime() - now.getTime();

      setTimeout(async () => {
        try {
          console.log('Executing daily time sync');
          await this.syncDeviceTime();
        } catch (error) {
          console.error('Error in daily time sync:', error);
        } finally {
          scheduleNextSync();
        }
      }, timeUntilNextSync);

      console.log('Next time sync scheduled for:', this.formatWIBTime(tomorrow));
    };

    scheduleNextSync();
    this.syncScheduled = true;
  }

  // Command Handling
  async sendCommand(deviceId, command) {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      if (!this.client || !this.isConnected) {
        throw new Error('MQTT client not connected');
      }

      const topic = `${this.topics.control}/${deviceId}`;
      const message = JSON.stringify(command);

      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Command timeout'));
        }, 5000);

        this.client.publish(topic, message, { qos: 2 }, (error) => {
          clearTimeout(timeoutId);
          if (error) {
            console.error('Error publishing command:', error);
            reject(error);
          } else {
            console.log('Command sent successfully:', {
              topic,
              command: message,
              timestamp: this.formatWIBTime(new Date())
            });
            setTimeout(() => resolve(true), 500);
          }
        });
      });
    } catch (error) {
      console.error('Error sending command:', error);
      throw error;
    }
  }

  // Device Settings Management
  async updateDeviceSettings(deviceId, settings) {
    try {
      const device = await Device.findOne({ deviceId });
      if (!device) {
        throw new Error(`Device not found: ${deviceId}`);
      }

      const updatedSettings = await DeviceSettings.findOneAndUpdate(
        { deviceId },
        settings,
        { 
          upsert: true, 
          new: true,
          runValidators: true 
        }
      );

      // Send settings update to device
      await this.sendCommand(deviceId, {
        update_settings: settings
      });

      return updatedSettings;
    } catch (error) {
      console.error('Error updating device settings:', error);
      throw error;
    }
  }

  // Connection Checking
  async checkDeviceConnection(deviceId) {
    try {
      const device = await Device.findOne({ deviceId });
      if (!device) {
        throw new Error(`Device not found: ${deviceId}`);
      }

      const now = new Date();
      const lastConnection = device.lastConnection || new Date(0);
      const timeSinceLastConnection = now - lastConnection;

      // Consider device offline if no connection in last 5 minutes
      if (timeSinceLastConnection > 5 * 60 * 1000) {
        await Device.findOneAndUpdate(
          { deviceId },
          { 
            status: 'disconnected',
            powerConnected: false
          }
        );

        await Alert.create({
          deviceId,
          type: 'warning',
          message: 'Device connection timeout'
        });

        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking device connection:', error);
      return false;
    }
  }

  // Cleanup Method
  disconnect() {
    try {
      if (this.client) {
        this.client.end();
        this.isConnected = false;
        this.client = null;
        this.connectionPromise = null;
        this.lastDeviceStatus.clear();
        console.log('MQTT Client disconnected');
      }
    } catch (error) {
      console.error('Error disconnecting MQTT client:', error);
    }
  }
}

// Create singleton instance
const mqttService = new MQTTService();

// Export the service
module.exports = mqttService;
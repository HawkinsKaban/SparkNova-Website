// services/deviceService.js
import api from './api';
import { toast } from 'react-hot-toast';

class DeviceService {
  constructor() {
    this.statusChangeCallbacks = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.lastProcessedStatus = new Map();
    this.statusDebounceTime = 1000; // 1 second debounce
  }

  // Poll device status
  async pollDeviceStatus(deviceId) {
    try {
      const response = await api.get(`/devices/${deviceId}`);
      if (response.data.success) {
        this.handleStatusUpdate({
          deviceId,
          status: response.data.data.status,
          relay_status: response.data.data.relayState,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error polling device status:', error);
    }
  }

  // Handle status updates with debouncing
  handleStatusUpdate(data) {
    try {
      if (!data.deviceId) return;

      const now = Date.now();
      const lastUpdate = this.lastProcessedStatus.get(data.deviceId);

      // Check if we should process this update
      if (lastUpdate && now - lastUpdate.time < this.statusDebounceTime) {
        return;
      }

      // Update last processed status
      this.lastProcessedStatus.set(data.deviceId, {
        status: data.status,
        time: now
      });

      console.log('Processing device status update:', data);
      this.notifyStatusChange(data);
    } catch (error) {
      console.error('Error handling status update:', error);
    }
  }

  // Notify status change subscribers
  notifyStatusChange(data) {
    this.statusChangeCallbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in status change callback:', error);
      }
    });
  }

  // Subscribe to status changes
  onStatusChange(callback) {
    this.statusChangeCallbacks.add(callback);
    return () => {
      this.statusChangeCallbacks.delete(callback);
    };
  }

  // Get all devices
  async getAllDevices() {
    try {
      const response = await api.get('/devices');
      console.log('Devices fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch devices');
      throw error;
    }
  }

  // Get device by ID
  async getDeviceById(deviceId) {
    try {
      const response = await api.get(`/devices/${deviceId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching device ${deviceId}:`, error);
      toast.error('Failed to fetch device details');
      throw error;
    }
  }

  // Control device relay with retry logic
  async controlRelay(deviceId, state, retryCount = 3) {
    try {
      const normalizedState = state === true || 
                          state === 'true' || 
                          state === 'connected' || 
                          state === 1;

      console.log(`Setting relay state for device ${deviceId} to ${normalizedState}`);
      
      // Optimistic update
      this.notifyStatusChange({
        deviceId,
        status: normalizedState ? 'connected' : 'disconnected',
        relay_status: normalizedState,
        timestamp: new Date().toISOString()
      });

      let lastError;
      for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
          const response = await api.put(`/devices/${deviceId}/relay`, { 
            state: normalizedState 
          });
          
          console.log('Relay control successful:', response.data);
          return response.data;
        } catch (error) {
          lastError = error;
          console.warn(`Relay control attempt ${attempt} failed:`, error);
          
          if (attempt < retryCount) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          }
        }
      }

      // Revert optimistic update on failure
      this.notifyStatusChange({
        deviceId,
        status: !normalizedState ? 'connected' : 'disconnected',
        relay_status: !normalizedState,
        timestamp: new Date().toISOString()
      });
      
      toast.error('Failed to control device after multiple attempts');
      throw lastError;
    } catch (error) {
      console.error(`Error controlling relay for device ${deviceId}:`, error);
      throw error;
    }
  }

  // Get device health status
  async getDeviceHealth(deviceId) {
    try {
      const response = await api.get(`/devices/${deviceId}/health`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching health status for device ${deviceId}:`, error);
      toast.error('Failed to fetch device health status');
      throw error;
    }
  }

  // Get device configuration
  async getDeviceConfig(deviceId) {
    try {
      const response = await api.get(`/devices/${deviceId}/config`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching config for device ${deviceId}:`, error);
      toast.error('Failed to fetch device configuration');
      throw error;
    }
  }

  // Update device configuration
  async updateDeviceConfig(deviceId, config) {
    try {
      const response = await api.put(`/devices/${deviceId}/config`, config);
      toast.success('Device configuration updated successfully');
      return response.data;
    } catch (error) {
      console.error(`Error updating config for device ${deviceId}:`, error);
      toast.error('Failed to update device configuration');
      throw error;
    }
  }

  // Register new device
  async registerDevice(deviceData) {
    try {
      const response = await api.post('/devices', deviceData);
      toast.success('Device registered successfully');
      return response.data;
    } catch (error) {
      console.error('Error registering device:', error);
      toast.error(error.response?.data?.message || 'Failed to register device');
      throw error;
    }
  }

  // Delete device
  async deleteDevice(deviceId) {
    try {
      const response = await api.delete(`/devices/${deviceId}`);
      toast.success('Device deleted successfully');
      return response.data;
    } catch (error) {
      console.error(`Error deleting device ${deviceId}:`, error);
      toast.error('Failed to delete device');
      throw error;
    }
  }

  // Get device uptime history
  async getUptimeHistory(deviceId, days = 7) {
    try {
      const response = await api.get(`/devices/${deviceId}/uptime`, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching uptime history for device ${deviceId}:`, error);
      toast.error('Failed to fetch device uptime history');
      throw error;
    }
  }

  // Cleanup resources
  cleanup() {
    this.statusChangeCallbacks.clear();
    this.lastProcessedStatus.clear();
  }
}

// Create and export singleton instance
const deviceService = new DeviceService();
export default deviceService;
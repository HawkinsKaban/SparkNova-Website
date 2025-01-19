// src/components/dashboard/hooks/deviceHooks.js
import { useState, useCallback, useRef } from 'react';
import { deviceService } from '../../../services/api';  // Updated import path

export const useDeviceData = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  // Fetch all devices
  const fetchDevices = useCallback(async (showLoading = true) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await deviceService.getAllDevices();
      if (response.success) {
        setDevices(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch devices');
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Failed to fetch devices');
      console.error('Error fetching devices:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  // Toggle device status
  const toggleDeviceStatus = useCallback(async (deviceId, status) => {
    try {
      setError(null);
      const response = await deviceService.controlRelay(deviceId, status);
      
      if (response.success) {
        setDevices(prev => prev.map(device => 
          device.deviceId === deviceId ? 
          { ...device, status: status ? 'connected' : 'disconnected' } : 
          device
        ));
        return true;
      }
      throw new Error(response.message || 'Failed to toggle device');
    } catch (err) {
      setError(err.message || 'Failed to toggle device');
      return false;
    }
  }, []);

  // Add new device
  const addDevice = useCallback(async (deviceData) => {
    try {
      setError(null);
      const response = await deviceService.registerDevice(deviceData);
      
      if (response.success) {
        setDevices(prev => [...prev, response.data]);
        return true;
      }
      throw new Error(response.message || 'Failed to add device');
    } catch (err) {
      setError(err.message || 'Failed to add device');
      return false;
    }
  }, []);

  // Update device
  const updateDevice = useCallback(async (deviceId, updateData) => {
    try {
      setError(null);
      const response = await deviceService.updateDevice(deviceId, updateData);
      
      if (response.success) {
        setDevices(prev => prev.map(device => 
          device.deviceId === deviceId ? 
          { ...device, ...response.data } : 
          device
        ));
        return true;
      }
      throw new Error(response.message || 'Failed to update device');
    } catch (err) {
      setError(err.message || 'Failed to update device');
      return false;
    }
  }, []);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    devices,
    loading,
    error,
    fetchDevices,
    toggleDeviceStatus,
    addDevice,
    updateDevice,
    cleanup
  };
};
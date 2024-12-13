import { useState, useCallback } from 'react';
import axios from 'axios';

export const useDeviceData = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDevices = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setDevices(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch devices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDevice = useCallback(async (deviceId, data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/devices/${deviceId}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setDevices(prev => 
          prev.map(device => 
            device.deviceId === deviceId 
              ? { ...device, ...response.data.data }
              : device
          )
        );
      }
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to update device');
    }
  }, []);

  const toggleDeviceStatus = useCallback(async (deviceId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'connected' ? 'disconnected' : 'connected';
      const response = await updateDevice(deviceId, { status: newStatus });
      return response;
    } catch (err) {
      throw new Error('Failed to toggle device status');
    }
  }, [updateDevice]);

  return {
    devices,
    loading,
    error,
    fetchDevices,
    updateDevice,
    toggleDeviceStatus,
    setDevices
  };
};
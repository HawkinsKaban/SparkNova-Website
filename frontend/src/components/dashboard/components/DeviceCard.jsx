import React, { memo, useState, useEffect, useCallback } from 'react';
import { MapPin, Zap, Battery } from 'lucide-react';
import { toast } from 'react-hot-toast';
import deviceService from '../../../services/deviceService';
import { energyService } from '../../../services/energyService';


const DeviceCard = memo(({ device, onToggle, onClick }) => {
  // State Management
  const [latestReading, setLatestReading] = useState(null);
  const [isToggling, setIsToggling] = useState(false);
  const [relayState, setRelayState] = useState(device.relayState || false);
  const [localDeviceStatus, setLocalDeviceStatus] = useState(device.status);
  const [lastUpdateTime, setLastUpdateTime] = useState(device.lastConnection);

  // Subscribe to device status updates
  useEffect(() => {
    const unsubscribe = deviceService.onStatusChange((data) => {
      if (data.deviceId === device.deviceId) {
        // Handle physical button changes
        if (data.relay_status !== undefined) {
          setRelayState(data.relay_status);
          setLocalDeviceStatus(data.relay_status ? 'connected' : 'disconnected');
        }
        setLastUpdateTime(new Date());
      }
    });

    return () => unsubscribe();
  }, [device.deviceId]);

  // Fetch latest reading
  const fetchLatestReading = useCallback(async () => {
    try {
      const response = await energyService.getLatestReading(device.deviceId);
      if (response.success) {
        setLatestReading(response.data);
        
        // Update states from latest reading
        if (response.data.status?.relayState !== undefined) {
          setRelayState(response.data.status.relayState);
          setLocalDeviceStatus(response.data.status.deviceStatus);
        }
        
        if (response.data.readings?.timestamp?.iso) {
          setLastUpdateTime(response.data.readings.timestamp.iso);
        }
      }
    } catch (error) {
      console.error('Failed to fetch latest reading:', error);
    }
  }, [device.deviceId]);

  // Setup periodic fetch
  useEffect(() => {
    fetchLatestReading();
    const interval = setInterval(fetchLatestReading, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [fetchLatestReading]);

  // Handle toggle
  const handleToggle = async (e) => {
    e.stopPropagation();
    
    if (isToggling) return;

    setIsToggling(true);
    const newState = !relayState;
    const previousState = relayState;

    try {
      // Optimistic update
      setRelayState(newState);
      setLocalDeviceStatus(newState ? 'connected' : 'disconnected');

      const response = await deviceService.controlRelay(device.deviceId, newState);
      
      if (response.success) {
        if (onToggle) {
          await onToggle(device.deviceId, newState);
        }
        toast.success(
          `Device ${newState ? 'turned on' : 'turned off'}`, 
          { position: 'bottom-right' }
        );
      } else {
        // Revert on failure
        setRelayState(previousState);
        setLocalDeviceStatus(previousState ? 'connected' : 'disconnected');
        throw new Error(response.message || 'Failed to control device');
      }
    } catch (error) {
      // Error handling
      setRelayState(previousState);
      setLocalDeviceStatus(previousState ? 'connected' : 'disconnected');
      toast.error(
        error.message || 'Failed to control device', 
        { position: 'bottom-right' }
      );
      console.error('Toggle failed:', error);
    } finally {
      setIsToggling(false);
    }
  };

  // Handle card click
  const handleCardClick = useCallback((e) => {
    const toggleLabel = document.getElementById(`toggle-${device.deviceId}`);
    if (!toggleLabel?.contains(e.target)) {
      onClick?.(e);
    }
  }, [onClick, device.deviceId]);

  // Format values
  const formatPower = useCallback((value) => {
    if (value == null || isNaN(value)) return '--';
    return relayState ? 
      `${parseFloat(value).toFixed(1)}W` : 
      '0.0W';
  }, [relayState]);

  const formatEnergy = useCallback((value) => {
    if (value == null || isNaN(value)) return '--';
    return `${parseFloat(value).toFixed(3)}kWh`;
  }, []);

  // Get current values
  const currentPower = latestReading?.readings?.power ?? 0;
  const totalEnergy = latestReading?.readings?.energy ?? 0;

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-gray-800">
              {device.name}
            </h3>
            <div className="flex items-center text-gray-500 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{device.location || 'No location'}</span>
            </div>
            <div className="text-sm text-blue-500 mt-1">
              {device.serviceType}
            </div>
          </div>

          {/* Toggle Switch */}
          <div 
            className="relative inline-block w-12 mr-2 align-middle select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              name={`toggle-${device.deviceId}`}
              id={`toggle-${device.deviceId}`}
              checked={relayState}
              onChange={handleToggle}
              disabled={isToggling}
              className="hidden"
            />
            <label
              htmlFor={`toggle-${device.deviceId}`}
              className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors 
                ${relayState ? 'bg-green-400' : 'bg-gray-300'}
                ${isToggling ? 'opacity-50' : ''}`}
            >
              <span
                className={`block h-6 w-6 rounded-full bg-white shadow transform transition-transform 
                  ${relayState ? 'translate-x-6' : 'translate-x-0'}
                  ${isToggling ? 'animate-pulse' : ''}`}
              />
            </label>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          {/* Power */}
          <div className="text-center">
            <div className="flex items-center justify-center text-blue-500 mb-1">
              <Zap className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-500">Power</p>
            <p className="text-sm font-semibold">
              {formatPower(currentPower)}
            </p>
          </div>

          {/* Energy */}
          <div className="text-center">
            <div className="flex items-center justify-center text-green-500 mb-1">
              <Battery className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-500">Energy</p>
            <p className="text-sm font-semibold">
              {formatEnergy(totalEnergy)}
            </p>
          </div>

          {/* Status */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <span 
                className={`inline-block w-2 h-2 rounded-full ${
                  relayState ? 'bg-green-400' : 'bg-red-400'
                }`} 
              />
            </div>
            <p className="text-xs text-gray-500">Status</p>
            <p className={`text-sm font-semibold ${
              relayState ? 'text-green-600' : 'text-red-600'
            }`}>
              {relayState ? 'ON' : 'OFF'}
            </p>
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdateTime && (
          <div className="mt-4 text-xs text-gray-400 text-right">
            Last update: {new Date(lastUpdateTime).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
});

DeviceCard.displayName = 'DeviceCard';

export default DeviceCard;
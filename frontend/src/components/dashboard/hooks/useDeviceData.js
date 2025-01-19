// src/hooks/useEnergyData.js
import { useState, useEffect, useCallback } from 'react';
import { energyService } from '../services/api';

export const useEnergyData = (deviceId) => {
  const [latestReading, setLatestReading] = useState(null);
  const [energyData, setEnergyData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to get time range based on period
  const getTimeRange = (period) => {
    const endTime = new Date();
    const startTime = new Date();

    switch (period) {
      case 'hourly':
        startTime.setHours(endTime.getHours() - 1);
        break;
      case 'daily':
        startTime.setDate(endTime.getDate() - 1);
        break;
      case 'weekly':
        startTime.setDate(endTime.getDate() - 7);
        break;
      case 'monthly':
        startTime.setMonth(endTime.getMonth() - 1);
        break;
      default:
        startTime.setDate(endTime.getDate() - 1); // default to daily
    }

    return {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    };
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp, periodType) => {
    const date = new Date(timestamp);
    switch (periodType) {
      case 'daily':
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      case 'weekly':
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
      case 'monthly':
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      case 'time':
        return date.toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          month: 'numeric',
          day: 'numeric',
          year: 'numeric'
        });
      default:
        return date.toLocaleString('en-US');
    }
  };

  // Fetch latest reading
  const fetchLatestReading = useCallback(async () => {
    try {
      const response = await energyService.getLatestReading(deviceId);
      if (response.success) {
        setLatestReading(response.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching latest reading:', err);
      setError('Failed to fetch latest reading');
    }
  }, [deviceId]);

  // Fetch energy readings and statistics
  const fetchEnergyData = useCallback(async (period = 'daily') => {
    setLoading(true);
    try {
      const timeRange = getTimeRange(period);
      
      // Get readings data
      const readingsResponse = await energyService.getReadings(deviceId, {
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
        period
      });

      if (readingsResponse.success) {
        const { data, summary, costs } = readingsResponse.data;

        // Format chart data
        const formattedData = data.map(reading => ({
          timestamp: reading.timestamp,
          power: reading.power,
          energy: reading.energy,
          voltage: reading.voltage,
          current: reading.current
        }));

        setEnergyData(formattedData);

        // Set statistics
        setStatistics({
          averagePower: summary.averagePower,
          totalEnergy: summary.totalEnergy,
          maximumPower: summary.maximumPower,
          formattedCost: costs?.formatted || 'Rp 0'
        });

        setError(null);
      }
    } catch (err) {
      console.error('Error fetching energy data:', err);
      setError('Failed to fetch energy data');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // Get metrics from latest reading
  const getMetrics = useCallback(() => {
    if (!latestReading?.measurements) return null;

    const { measurements } = latestReading;
    return {
      voltage: {
        value: measurements.voltage.value,
        status: measurements.voltage.status
      },
      current: measurements.current,
      power: {
        value: measurements.power.value,
        percentage: measurements.power.percentage,
        status: measurements.power.status
      },
      energy: measurements.energy,
      frequency: measurements.frequency,
      powerFactor: measurements.powerFactor
    };
  }, [latestReading]);

  // Initial data fetch
  useEffect(() => {
    if (deviceId) {
      // Fetch initial data
      const fetchInitialData = async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchLatestReading(),
            fetchEnergyData('daily')
          ]);
        } catch (err) {
          console.error('Error fetching initial data:', err);
          setError('Failed to fetch initial data');
        } finally {
          setLoading(false);
        }
      };

      fetchInitialData();

      // Set up periodic refresh for latest reading
      const refreshInterval = setInterval(fetchLatestReading, 30000); // 30 seconds

      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [deviceId, fetchLatestReading, fetchEnergyData]);

  return {
    // Data
    latestReading,
    energyData,
    statistics,
    loading,
    error,
    
    // Computed values
    metrics: getMetrics(),
    
    // Utility functions
    formatTimestamp,
    
    // Actions
    fetchEnergyData,
    refreshData: fetchLatestReading
  };
};

export default useEnergyData;
// src/components/dashboard/hooks/useEnergyData.js
import { useState, useEffect, useCallback, useRef } from 'react';

export function useEnergyData(deviceId) {  // Changed to named export
  const [latestReading, setLatestReading] = useState(null);
  const [energyData, setEnergyData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [costs, setCosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const mountedRef = useRef(true);
  const latestRequestRef = useRef(null);

  // Helper function to get time range based on period
  const getTimeRange = (period) => {
    const endTime = new Date();
    const startTime = new Date();

    switch (period) {
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
        startTime.setDate(endTime.getDate() - 1);
    }

    return {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      period
    };
  };

  // Fetch latest reading
  const fetchLatestReading = useCallback(async () => {
    if (!deviceId || !mountedRef.current) return;

    try {
      // Simulasi data untuk demo
      const response = {
        success: true,
        data: {
          readings: {
            power: 6.6,
            energy: 0.078,
            voltage: 231.6,
            current: 0.03,
            powerFactor: 0.95,
            frequency: 49.9
          },
          status: {
            deviceStatus: 'connected',
            timestamp: {
              local: new Date().toLocaleString()
            }
          }
        }
      };
      
      setLatestReading(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching latest reading:', err);
      setError('Failed to fetch latest reading');
    }
  }, [deviceId]);

  // Fetch historical data
  const fetchHistoricalData = useCallback(async (period = 'daily') => {
    if (!deviceId || !mountedRef.current) return;
    
    setLoading(true);
    try {
      // Simulasi data untuk demo
      const data = {
        energyData: Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
          power: Math.random() * 10,
          energy: Math.random() * 0.1
        })),
        statistics: {
          avgPower: 5.75,
          maxPower: 8.5,
          minPower: 3.2,
          totalEnergy: 0.021
        },
        costs: {
          costs: {
            formatted: 'Rp 171',
            base: 28,
            ppjTax: 142,
            adminFee: 1,
            total: 171
          }
        },
        predictions: {
          daily: { energy: 0.05 },
          weekly: { energy: 0.35 },
          monthly: { energy: 1.54 },
          confidenceLevel: 0.991
        }
      };

      setEnergyData(data.energyData);
      setStatistics(data.statistics);
      setCosts(data.costs);
      setPredictions(data.predictions);
      setError(null);
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError('Failed to fetch energy data');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  // Setup initial data fetch and polling
  useEffect(() => {
    if (!deviceId) return;
    
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchLatestReading(),
          fetchHistoricalData('daily')
        ]);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to fetch initial data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Setup polling intervals
    const readingInterval = setInterval(fetchLatestReading, 5000);
    const dataInterval = setInterval(() => fetchHistoricalData('daily'), 30000);

    return () => {
      mountedRef.current = false;
      clearInterval(readingInterval);
      clearInterval(dataInterval);
    };
  }, [deviceId, fetchLatestReading, fetchHistoricalData]);

  return {
    latestReading,
    energyData,
    statistics,
    predictions,
    costs,
    loading,
    error,
    fetchHistoricalData,
    fetchLatestReading
  };
}
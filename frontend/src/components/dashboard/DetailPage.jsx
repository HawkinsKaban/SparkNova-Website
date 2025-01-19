import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCcw,
  Wallet,
  Activity,
  TrendingUp
} from 'lucide-react';
import deviceService from '../../services/deviceService';
import energyService from '../../services/energyService';
import MetricsGrid from './components/MetricsGrid';
import EnergyChart from './components/EnergyChart';

const DetailPage = () => {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const [period, setPeriod] = useState('daily');
  
  // State for different data types
  const [latestReading, setLatestReading] = useState(null);
  const [hourlyData, setHourlyData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [costs, setCosts] = useState(null);
  const [predictions, setPredictions] = useState(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Ref for previous reading comparison
  const previousReadingRef = useRef(null);

  // Comprehensive data fetching function
  const fetchAllData = useCallback(async () => {
    if (!deviceId) return;

    try {
      setLoading(true);

      // Fetch latest reading
      const latestReadingResponse = await deviceService.getDeviceById(deviceId);
      const energyReadingResponse = await energyService.getLatestReading(deviceId);
      
      // Combine device and energy reading data
      const combinedReading = {
        ...latestReadingResponse.data,
        readings: energyReadingResponse.data.readings,
        status: energyReadingResponse.data.status
      };
      setLatestReading(combinedReading);

      // Fetch usage history
      const usageResponse = await energyService.getReadings(deviceId, period);
      setHourlyData(usageResponse.data.hourlyData || []);

      // Fetch statistics
      const statisticsResponse = await energyService.getStatistics(deviceId, period);
      setStatistics(statisticsResponse.data.summary);

      // Fetch costs
      const costsResponse = await energyService.getCosts(deviceId, period);
      setCosts({
        ...costsResponse.data.costs,
        total: {
          formatted: costsResponse.data.costs.costs.formatted,
          value: costsResponse.data.costs.costs.total
        },
        base: costsResponse.data.costs.costs.base,
        ppjTax: costsResponse.data.costs.costs.ppjTax,
        adminFee: costsResponse.data.costs.costs.adminFee
      });

      // Fetch predictions
      const predictionsResponse = await energyService.getPredictions(deviceId);
      setPredictions(predictionsResponse.data.prediction);

      setError(null);
    } catch (err) {
      console.error('Error fetching device data:', err);
      setError('Failed to fetch device data');
    } finally {
      setLoading(false);
    }
  }, [deviceId, period]);

  // Initial and periodic data fetch
  useEffect(() => {
    fetchAllData();
    const intervalId = setInterval(fetchAllData, 30000); // Refresh every 30 seconds
    return () => clearInterval(intervalId);
  }, [fetchAllData]);

  // Update previous reading reference
  useEffect(() => {
    if (latestReading) {
      previousReadingRef.current = latestReading;
    }
  }, [latestReading]);

  // Handle period change
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <RefreshCcw className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{latestReading?.device?.name || 'Device Details'}</h1>
            <p className="text-sm text-gray-500">ID: {deviceId}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily View</option>
            <option value="weekly">Weekly View</option>
            <option value="monthly">Monthly View</option>
          </select>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            latestReading?.status?.deviceStatus === 'connected' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {latestReading?.status?.deviceStatus || 'Unknown'}
          </div>
        </div>
      </div>

      {/* Latest Reading Monitor */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Real-Time Monitoring</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              latestReading?.status?.deviceStatus === 'connected' 
                ? 'bg-green-500 animate-pulse' 
                : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-600">
              {latestReading?.status?.deviceStatus === 'connected' ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <MetricsGrid 
          latestReading={latestReading}
          isLoading={loading}
        />

        <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
          <span>Auto-refresh every 30s</span>
          <span>Last update: {
            latestReading?.readings?.timestamp?.local 
              ? latestReading.readings.timestamp.local
              : 'Never'
          }</span>
        </div>
      </div>

      {/* Energy Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <EnergyChart 
          data={hourlyData}
          period={period}
          loading={loading}
        />
      </div>

      {/* Statistics, Costs, and Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Costs Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Cost Analysis</h3>
            <Wallet className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold">
                {costs?.total?.formatted || 'Rp 0'}
              </p>
              <p className="text-sm text-gray-500">Total Cost</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Base Cost</span>
                <span>Rp {costs?.base?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>PPJ Tax</span>
                <span>Rp {costs?.ppjTax?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Admin Fee</span>
                <span>Rp {costs?.adminFee?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Usage Statistics</h3>
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold">
                {statistics?.averagePower?.toFixed(2) || '0'} W
              </p>
              <p className="text-sm text-gray-500">Average Power</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Maximum Power</span>
                <span>{statistics?.maximumPower?.toFixed(2) || '0'} W</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Minimum Power</span>
                <span>{statistics?.minimumPower?.toFixed(2) || '0'} W</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Energy</span>
                <span>{statistics?.totalEnergy?.toFixed(3) || '0'} kWh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Predictions Card */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Usage Predictions</h3>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold">
                {predictions?.monthly?.energy?.toFixed(3) || '0'} kWh
              </p>
              <p className="text-sm text-gray-500">Predicted Monthly Usage</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Daily Prediction</span>
                <span>{predictions?.daily?.energy?.toFixed(3) || '0'} kWh</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Weekly Prediction</span>
                <span>{predictions?.weekly?.energy?.toFixed(3) || '0'} kWh</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Confidence Level</span>
                <span>{((predictions?.confidenceLevel || 0) * 100)?.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { getEnergyData, getEnergyHistory } from '../../services/api';
import EnergyChart from './EnergyChart';
import PowerControl from './PowerControl';

const Dashboard = () => {
  const [currentData, setCurrentData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [current, history] = await Promise.all([
          getEnergyData(),
          getEnergyHistory()
        ]);
        setCurrentData(current.data);
        setHistoricalData(history.data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Poll for new data every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-600 p-4 rounded-lg m-4">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Energy Dashboard</h1>
      
      <PowerControl />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MetricCard
          title="Voltage"
          value={currentData?.tegangan || 0}
          unit="V"
        />
        <MetricCard
          title="Current"
          value={currentData?.arus || 0}
          unit="A"
        />
        <MetricCard
          title="Power"
          value={currentData?.daya || 0}
          unit="W"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Energy Consumption History</h2>
        <EnergyChart data={historicalData} />
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, unit }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h3 className="text-gray-600 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold mt-2">
      {value.toFixed(2)}
      <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
    </p>
  </div>
);

export default Dashboard;
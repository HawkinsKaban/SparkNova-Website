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
        const [current, history] = await Promise.all([getEnergyData(), getEnergyHistory()]);
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
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      {/* <PowerControl /> */}
      <div className="flex flex-wrap gap-4">
        <MetricCard
          power="50"
          unit="Portable Speaker"
        />
        <MetricCard
          power="30"
          unit="LED Light"
        />
        <MetricCard
          power="100"
          unit="Air Conditioner"
        />
      </div>

      {/* <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Energy Consumption History</h2>
        <EnergyChart data={historicalData} />
      </div> */}
    </div>
  );
};

const MetricCard = ({ power, unit }) => {
  const [isOn, setIsOn] = useState(false);

  // Toggle handler
  const handleToggle = () => {
    setIsOn(!isOn);
  };

  return (
    <div className="bg-white p-6 w-96 rounded-lg shadow-md">
      <div className="flex justify-between">
        <div className="">
          <h3 className="font-bold text-2xl mb-4">{power}W</h3>
          <p className="text-md font-semibold">
            <span className="text-sm font-normal ml-1">{unit}</span>
          </p>
        </div>
        <div className="flex items-center -mt-10">
          <label className="relative inline-block w-12 h-6">
            <input
              type="checkbox"
              checked={isOn}
              onChange={handleToggle}
              className="opacity-0 w-0 h-0"
            />
            <span
              className={`slider round ${isOn ? 'bg-green-500' : 'bg-gray-300'}`}
            ></span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

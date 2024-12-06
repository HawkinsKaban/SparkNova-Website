// components/dashboard/EnergyChart.jsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const EnergyChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="timestamp" 
          tickFormatter={(time) => new Date(time).toLocaleTimeString()}
        />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip 
          labelFormatter={(label) => new Date(label).toLocaleString()}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="power"
          stroke="#8884d8"
          name="Power (W)"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="energy"
          stroke="#82ca9d"
          name="Energy (kWh)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default EnergyChart;
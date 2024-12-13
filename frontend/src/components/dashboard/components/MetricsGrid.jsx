import React from 'react';
import { Activity, Battery, Gauge, Zap } from 'lucide-react';

export const MetricsGrid = ({ readings }) => {
  const metrics = [
    { 
      icon: Zap, 
      label: 'Voltage', 
      value: readings.voltage.value, 
      unit: readings.voltage.unit,
      color: 'text-yellow-500'
    },
    { 
      icon: Activity, 
      label: 'Current', 
      value: readings.current.value, 
      unit: readings.current.unit,
      color: 'text-blue-500'
    },
    { 
      icon: Gauge, 
      label: 'Power', 
      value: readings.power.value, 
      unit: readings.power.unit,
      color: 'text-green-500'
    },
    { 
      icon: Battery, 
      label: 'Energy', 
      value: readings.energy.value, 
      unit: readings.energy.unit,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metrics.map(({ icon: Icon, label, value, unit, color }, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center mb-2">
            <Icon className={`w-5 h-5 mr-2 ${color}`} />
            <span className="text-sm text-gray-500">{label}</span>
          </div>
          <p className="text-xl font-semibold">
            {value}
            <span className="text-sm text-gray-500 ml-1">{unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
};
import React from 'react';
import { MapPin } from 'lucide-react';

export const DeviceCard = ({
  device,
  onNavigate,
  onToggle,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div 
            onClick={() => onNavigate(device.deviceId)} 
            className="cursor-pointer flex-grow group"
          >
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600">
              {device.name}
            </h3>
            <div className="flex items-center text-gray-500 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{device.location}</span>
            </div>
            <div className="text-blue-500 text-sm mt-2">{device.serviceType}</div>
          </div>
          
          {/* Toggle Switch */}
          <div className="relative inline-block w-12 mr-2 align-middle select-none">
            <input
              type="checkbox"
              checked={device.status === 'connected'}
              onChange={() => onToggle(device.deviceId, device.status)}
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
            />
            <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
          </div>
        </div>

        {/* Device Metrics */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-sm text-gray-500">Power</p>
            <p className="text-lg font-semibold text-gray-800">
              {device.currentPower ? `${device.currentPower} kW` : 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Energy</p>
            <p className="text-lg font-semibold text-gray-800">
              {device.totalEnergy ? `${device.totalEnergy} kWh` : 'N/A'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">Status</p>
            <span 
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                device.status === 'connected' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {device.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
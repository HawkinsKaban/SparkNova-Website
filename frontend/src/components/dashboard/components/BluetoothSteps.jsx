import React from 'react';
import { Bluetooth } from 'lucide-react';

export const BluetoothSteps = ({
  step,
  onConnect,
  isSupported
}) => {
  const renderStep = () => {
    switch(step) {
      case 'initial':
        return (
          <div className="text-center">
            <Bluetooth className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <p className="mb-4">Connect to your ESP32 device via Bluetooth</p>
            <button 
              onClick={onConnect}
              disabled={!isSupported}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Connect Device
            </button>
          </div>
        );

      case 'connecting':
        return (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p>Connecting to device...</p>
          </div>
        );

      case 'connected':
        return (
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium">Device Connected Successfully</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mb-6">
      {renderStep()}
    </div>
  );
};
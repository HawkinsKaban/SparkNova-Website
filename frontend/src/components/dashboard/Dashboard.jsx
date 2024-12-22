import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, RefreshCw } from 'lucide-react';
import { DeviceCard } from './components/DeviceCard';
import { DeviceModal } from './components/DeviceModal';
import { useDeviceData } from './hooks/useDeviceData';
import { useBluetoothDevice } from './hooks/useBluetoothDevice';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    devices, 
    loading, 
    error: deviceError, 
    fetchDevices, 
    toggleDeviceStatus 
  } = useDeviceData();

  const {
    bluetoothSupported,
    connectionStep,
    error: bluetoothError,
    connectDevice,
    configureDevice,
    disconnect
  } = useBluetoothDevice();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    deviceId: '',
    name: '',
    location: '',
    serviceType: '',
    wifiSSID: '',
    wifiPassword: '',
  });

  // Auto fetch data
  const fetchData = useCallback(async (signal) => {
    try {
      await fetchDevices(signal);
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('Error fetching devices:', error);
    }
  }, [fetchDevices]);

  useEffect(() => {
    const abortController = new AbortController();
    
    fetchData(abortController.signal);
    const interval = setInterval(() => {
      fetchData(abortController.signal);
    }, 5000);

    return () => {
      abortController.abort();
      clearInterval(interval);
    };
  }, [fetchData, location.pathname]);

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const configured = await configureDevice(formData);
      if (!configured) return;

      await fetchDevices();
      closeModal();
    } catch (err) {
      console.error('Device setup failed:', err);
    }
  };

  // Modal handlers
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    disconnect();
    setFormData({
      deviceId: '',
      name: '',
      location: '',
      serviceType: '',
      wifiSSID: '',
      wifiPassword: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Device Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your connected devices</p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button 
              onClick={openModal}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              Add Device
            </button>
          </div>
        </div>

        {/* Error Messages */}
        {(deviceError || bluetoothError) && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
            <p className="text-sm text-red-700">
              {deviceError || bluetoothError}
            </p>
          </div>
        )}

        {/* Devices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.length === 0 ? (
            <div className="col-span-3 text-center py-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <PlusCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No devices found</h3>
                <p className="text-gray-500 mt-2">
                  Add your first device by clicking the button above.
                </p>
              </div>
            </div>
          ) : (
            devices.map(device => (
              <DeviceCard
                key={device.deviceId}
                device={device}
                onNavigate={(id) => navigate(`/detail/${id}`)}
                onToggle={toggleDeviceStatus}
              />
            ))
          )}
        </div>
      </div>

      {/* Device Modal */}
      <DeviceModal
        isOpen={isModalOpen}
        onClose={closeModal}
        error={bluetoothError}
        bluetoothSupported={bluetoothSupported}
        connectionStep={connectionStep}
        onConnect={connectDevice}
        formData={formData}
        onChange={handleInputChange}
        onSubmit={handleFormSubmit}
        loading={loading}
      />
    </div>
  );
};

export default Dashboard;
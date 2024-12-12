import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Power, Settings, PlusCircle, RefreshCw, Wifi, Bluetooth, MapPin } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const [connectionStep, setConnectionStep] = useState('initial');
  const [bluetoothDevice, setBluetoothDevice] = useState(null);
  const [formData, setFormData] = useState({
    deviceId: '',
    name: '',
    location: '',
    serviceType: '',
    wifiSSID: '',
    wifiPassword: '',
  });

  const navigate = useNavigate();

  const serviceTypes = [
    'R1_900VA', 
    'R1_1300VA', 
    'R1_2200VA', 
    'R2_3500VA', 
    'R3_6600VA'
  ];

  // Check Bluetooth support on component mount
  useEffect(() => {
    setBluetoothSupported('bluetooth' in navigator);
  }, []);

  // Fetch devices
  const fetchDevices = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/devices`, config);

      if (response.data.success) {
        setDevices(response.data.data);
      }
    } catch (err) {
      setError('Failed to fetch devices');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial and periodic device fetching
  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  // Bluetooth Device Connection
  const connectBluetoothDevice = async () => {
    if (!bluetoothSupported) {
      setError('Bluetooth is not supported in this browser');
      return false;
    }

    try {
      setConnectionStep('connecting');
      setError(null);

      // Request Bluetooth device
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ 
          // Specify your device's name or service UUID
          name: 'ESP32_DeviceConfig'
        }],
        optionalServices: ['device_configuration_service']
      });

      // Connect to the device
      const server = await device.gatt.connect();
      
      // Store the connected device
      setBluetoothDevice(device);
      setConnectionStep('connected');

      // Add device connection listener
      device.gatt.addEventListener('gattserverdisconnected', () => {
        setConnectionStep('initial');
        setBluetoothDevice(null);
      });

      return true;
    } catch (err) {
      console.error('Bluetooth connection error:', err);
      setError(err.message || 'Failed to connect to Bluetooth device');
      setConnectionStep('initial');
      return false;
    }
  };

  // Configure Device via Bluetooth
  const configureBluetoothDevice = async () => {
    if (!bluetoothDevice) {
      setError('Please connect to a device first');
      return false;
    }

    try {
      setConnectionStep('configuring');
      const server = await bluetoothDevice.gatt.connect();
      const service = await server.getPrimaryService('device_configuration_service');

      // Write configuration characteristics
      const writeCharacteristic = async (characteristicUUID, value) => {
        const characteristic = await service.getCharacteristic(characteristicUUID);
        const encoder = new TextEncoder();
        await characteristic.writeValue(encoder.encode(value));
      };

      // Write device configuration data
      await writeCharacteristic('wifi_ssid', formData.wifiSSID);
      await writeCharacteristic('wifi_password', formData.wifiPassword);
      await writeCharacteristic('device_id', formData.deviceId);

      return true;
    } catch (err) {
      console.error('Bluetooth configuration error:', err);
      setError('Failed to configure device via Bluetooth');
      return false;
    }
  };

  // Form submission handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Configure the device via Bluetooth
      const configured = await configureBluetoothDevice();
      
      if (!configured) {
        setLoading(false);
        return;
      }

      // Register device in backend
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/devices`, formData, config);

      if (response.data.success) {
        setDevices(prev => [...prev, response.data.data]);
        closeModal();
      } else {
        setError('Failed to register device in backend');
      }
    } catch (err) {
      setError('Device setup failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Modal management
  const openModal = () => {
    setIsModalOpen(true);
    setConnectionStep('initial');
    setError(null);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setConnectionStep('initial');
    setError(null);
    // Disconnect Bluetooth device if connected
    if (bluetoothDevice && bluetoothDevice.gatt.connected) {
      bluetoothDevice.gatt.disconnect();
    }
  };

  // Input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Device toggle handler
  const handleDeviceToggle = async (deviceId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'connected' ? 'disconnected' : 'connected';
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/devices/${deviceId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setDevices(prev => 
          prev.map(device => 
            device.deviceId === deviceId 
              ? { ...device, status: newStatus } 
              : device
          )
        );
      }
    } catch (err) {
      setError('Failed to update device status');
    }
  };

  // Render Bluetooth Connection Steps
  const renderBluetoothConnectionStep = () => {
    switch(connectionStep) {
      case 'initial':
        return (
          <div className="text-center">
            <p className="mb-4">Connect to your ESP32 device via Bluetooth</p>
            <button 
              onClick={connectBluetoothDevice}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              disabled={!bluetoothSupported}
            >
              Connect Bluetooth Device
            </button>
          </div>
        );
      
      case 'connecting':
        return (
          <div className="text-center">
            <p>Connecting to Bluetooth device...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mx-auto mt-4"></div>
          </div>
        );
      
      case 'connected':
        return (
          <div className="text-center">
            <p className="text-green-600 mb-4">✓ Device Connected Successfully</p>
            <p className="mb-4">You can now configure your device</p>
          </div>
        );
      
      case 'configuring':
        return (
          <div className="text-center">
            <p>Configuring device...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mx-auto mt-4"></div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Dashboard Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Device Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your connected devices</p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <button
              onClick={() => fetchDevices()}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
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

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

     {/* Devices Grid */}
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {devices.length === 0 ? (
    <div className="col-span-3 text-center py-8">
      <div className="bg-gray-50 rounded-lg p-6">
        <PlusCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No devices found</h3>
        <p className="text-gray-500 mt-2">Add your first device by clicking the button above.</p>
      </div>
    </div>
  ) : (
    devices.map(device => (
      <div
        key={device.deviceId}
        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div 
              onClick={() => navigate(`/detail/${device.deviceId}`)} 
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
            <div className="relative inline-block w-12 mr-2 align-middle select-none">
              <input
                type="checkbox"
                checked={device.status === 'connected'}
                onChange={() => handleDeviceToggle(device.deviceId, device.status)}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
              />
              <label className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
            </div>
          </div>
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
    ))
  )}
</div>

      
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Add New Device</h2>
                <button 
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {!bluetoothSupported && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                  <p className="text-sm text-yellow-700">Bluetooth is not supported in this browser</p>
                </div>
              )}

              {/* Connection Steps */}
              <div className="mb-6">
                {connectionStep === 'initial' && (
                  <div className="text-center">
                    <Bluetooth className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <p className="mb-4">Connect to your ESP32 device via Bluetooth</p>
                    <button 
                      onClick={connectBluetoothDevice}
                      disabled={!bluetoothSupported}
                      className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Connect Device
                    </button>
                  </div>
                )}

                {connectionStep === 'connecting' && (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                    <p>Connecting to device...</p>
                  </div>
                )}

                {connectionStep === 'connected' && (
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-green-600 font-medium">Device Connected Successfully</p>
                  </div>
                )}
              </div>

              {/* Configuration Form */}
              {connectionStep === 'connected' && (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Device Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Device ID</label>
                    <input
                      type="text"
                      name="deviceId"
                      value={formData.deviceId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Device Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                    <select
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Service Type</option>
                      {serviceTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* WiFi Configuration */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center mb-4">
                      <Wifi className="w-5 h-5 text-blue-500 mr-2" />
                      <h3 className="text-lg font-medium">WiFi Configuration</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Network Name</label>
                        <input
                          type="text"
                          name="wifiSSID"
                          value={formData.wifiSSID}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                          type="password"
                          name="wifiPassword"
                          value={formData.wifiPassword}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                    </div>
                  </div>

<div className="bg-blue-50 p-4 rounded-lg mt-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 001-1v-3a1 1 0 100-2h-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            🔒 Ensure device is in Bluetooth pairing mode
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            📡 WiFi credentials are sent securely
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 mt-6">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Configuring...' : 'Add Device'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

      {/* CSS untuk toggle switch */}
      <style jsx>{`
        .toggle-checkbox:checked {
          right: 0;
          border-color: #3B82F6;
        }
        .toggle-checkbox:checked + .toggle-label {
          background-color: #3B82F6;
        }
        .toggle-checkbox {
          right: 0;
          transition: all 0.3s;
        }
        .toggle-label {
          transition: all 0.3s;
        }
      `}</style>
    </div>
  </div>
);

};

export default Dashboard;
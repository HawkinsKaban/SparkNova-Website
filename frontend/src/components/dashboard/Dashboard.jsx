import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const [connectionStep, setConnectionStep] = useState('initial'); // 'initial', 'connecting', 'connected', 'configuring'
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

  // Render main dashboard
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Device Dashboard</h1>
        <button 
          onClick={openModal} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Device
        </button>
      </header>

      {error && (
        <div className="bg-red-100 text-red-600 p-4 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map(device => (
          <DeviceCard 
            key={device.deviceId}
            device={device}
            onToggle={handleDeviceToggle}
            onClick={() => navigate(`/device/${device.deviceId}`)}
          />
        ))}
      </div>

      {/* Device Configuration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-8 w-96">
            <h2 className="text-2xl font-bold mb-6">Configure New Device</h2>
            
            {error && (
              <div className="bg-red-100 text-red-600 p-4 rounded mb-4">
                {error}
              </div>
            )}

            {!bluetoothSupported && (
              <div className="bg-yellow-100 text-yellow-700 p-4 rounded mb-4">
                Bluetooth is not supported in your browser
              </div>
            )}

            {/* Bluetooth Connection Steps */}
            {renderBluetoothConnectionStep()}

            {/* Device Configuration Form - shown only when connected */}
            {connectionStep === 'connected' && (
              <form onSubmit={handleFormSubmit}>
                <div className="space-y-4">
                  <input
                    type="text"
                    name="deviceId"
                    placeholder="Device ID"
                    value={formData.deviceId}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                  <input
                    type="text"
                    name="name"
                    placeholder="Device Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                  <input
                    type="text"
                    name="location"
                    placeholder="Device Location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    required
                  >
                    <option value="">Select Service Type</option>
                    {serviceTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name="wifiSSID"
                    placeholder="WiFi Network Name"
                    value={formData.wifiSSID}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                  <input
                    type="password"
                    name="wifiPassword"
                    placeholder="WiFi Password"
                    value={formData.wifiPassword}
                    onChange={handleInputChange}
                    className="w-full border p-2 rounded"
                    required
                  />
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                    <p>🔒 Ensure device is in Bluetooth pairing mode</p>
                    <p>📡 WiFi credentials sent securely</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <button 
                      type="button" 
                      onClick={closeModal} 
                      className="bg-gray-200 px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                      disabled={loading}
                    >
                      {loading ? 'Configuring...' : 'Add Device'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-blue-500"></div>
  </div>
);

// Device Card Component
const DeviceCard = ({ device, onToggle, onClick }) => {
  const [isOn, setIsOn] = useState(device.status === 'connected');

  const handleToggle = () => {
    setIsOn(!isOn);
    onToggle(device.deviceId, device.status);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex justify-between items-center">
      <div onClick={onClick} className="cursor-pointer flex-grow">
        <h3 className="text-xl font-bold">{device.name}</h3>
        <p className="text-gray-500">{device.location}</p>
        <p className="text-blue-500">{device.serviceType}</p>
      </div>
      <div>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={isOn} 
            onChange={handleToggle} 
          />
          <span className="slider round"></span>
        </label>
      </div>
    </div>
  );
};

export default Dashboard;
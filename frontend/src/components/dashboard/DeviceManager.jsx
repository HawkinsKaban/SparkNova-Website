// components/dashboard/DeviceManager.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DeviceManager = () => {
  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState({
    deviceId: '',
    nama: '',
    lokasi: '',
    wifiSSID: '',
    wifiPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch devices saat komponen dimount
  useEffect(() => {
    fetchDevices();
  }, []);

  // Ambil daftar device
  const fetchDevices = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/devices', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDevices(response.data.data);
    } catch (err) {
      setError('Failed to fetch devices');
      console.error('Error:', err);
    }
  };

  // Tambah device baru
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        'http://localhost:5000/api/devices/register',
        newDevice,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setDevices([...devices, response.data.data]);
        setNewDevice({
          deviceId: '',
          nama: '',
          lokasi: '',
          wifiSSID: '',
          wifiPassword: ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add device');
    } finally {
      setLoading(false);
    }
  };

  // Hapus device
  const handleDelete = async (deviceId) => {
    try {
      await axios.delete(`http://localhost:5000/api/devices/${deviceId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchDevices();
    } catch (err) {
      setError('Failed to delete device');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Device Manager</h2>

      {/* Form tambah device */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Add New Device</h3>
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device ID
              </label>
              <input
                type="text"
                value={newDevice.deviceId}
                onChange={(e) => setNewDevice({ ...newDevice, deviceId: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={newDevice.nama}
                onChange={(e) => setNewDevice({ ...newDevice, nama: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={newDevice.lokasi}
                onChange={(e) => setNewDevice({ ...newDevice, lokasi: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WiFi SSID
              </label>
              <input
                type="text"
                value={newDevice.wifiSSID}
                onChange={(e) => setNewDevice({ ...newDevice, wifiSSID: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WiFi Password
              </label>
              <input
                type="password"
                value={newDevice.wifiPassword}
                onChange={(e) => setNewDevice({ ...newDevice, wifiPassword: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Adding...' : 'Add Device'}
          </button>
        </form>
      </div>

      {/* Daftar device */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {devices.map((device) => (
          <div key={device._id} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{device.nama}</h3>
                <p className="text-gray-600">ID: {device.deviceId}</p>
                <p className="text-gray-600">Location: {device.lokasi}</p>
                <p className="text-gray-600">Status: {device.status || 'Unknown'}</p>
              </div>
              <button
                onClick={() => handleDelete(device._id)}
                className="text-red-500 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeviceManager;
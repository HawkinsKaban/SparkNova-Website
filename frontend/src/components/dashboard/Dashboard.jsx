import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]); // State to store fetched devices
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility
  const [formData, setFormData] = useState({
    idPerangkat: '',
    nama: '',
    lokasi: '',
    jenisLayanan: '',
    wifiSSID: '',
    wifiPassword: '',
  });
  const navigate = useNavigate();

  const jenisLayananOptions = [
    'R1_900VA', 
    'R1_1300VA', 
    'R1_2200VA', 
    'R2_3500VA', 
    'R3_6600VA'
  ];

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const response = await axios.get('http://localhost:5000/api/perangkat', config);

        if (response.data.sukses) {
          setDevices(response.data.data);
        }
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 5000); // Re-fetch data every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleCardClick = (deviceId) => {
    navigate(`/detail/${deviceId}`);
  };

  const handleToggle = async (deviceId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'connected' ? 'disconnected' : 'connected';
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.put(
        `http://localhost:5000/api/perangkat/${deviceId}`,
        { status: newStatus },
        config
      );

      if (response.data.sukses) {
        setDevices((prevDevices) =>
          prevDevices.map((device) =>
            device.deviceId === deviceId ? { ...device, status: newStatus } : device
          )
        );
      }
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.post('http://localhost:5000/api/perangkat', formData, config);

      if (response.data.sukses) {
        // Update device list after adding new device
        setDevices((prevDevices) => [...prevDevices, response.data.data]);
        closeModal();
      }
    } catch (err) {
      setError('Failed to add device');
    }
  };

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
      <div className="flex justify-end mb-4">
        <button
          onClick={openModal}
          className="bg-blue-500 text-white py-2 px-4 rounded-md"
        >
          Add Device
        </button>
      </div>
      <div className="flex flex-wrap gap-4">
        {devices.map((device) => (
          <MetricCard
            key={device._id}
            power={device.thresholds.warning}
            unit={device.name}
            status={device.status}
            onClick={() => handleCardClick(device.deviceId)}
            onToggle={() => handleToggle(device.deviceId, device.status)}
          />
        ))}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md w-96">
            <h2 className="text-xl font-bold mb-4">Add New Device</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Device ID</label>
                <input
                  type="text"
                  name="idPerangkat"
                  value={formData.idPerangkat}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  name="lokasi"
                  value={formData.lokasi}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Service Type</label>
                <select
                  name="jenisLayanan"
                  value={formData.jenisLayanan}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md"
                  required
                >
                  <option value="">Select Service Type</option>
                  {jenisLayananOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">WiFi SSID</label>
                <input
                  type="text"
                  name="wifiSSID"
                  value={formData.wifiSSID}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">WiFi Password</label>
                <input
                  type="password"
                  name="wifiPassword"
                  value={formData.wifiPassword}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="bg-gray-300 py-2 px-4 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded-md"
                >
                  Add Device
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ power, unit, status, onClick, onToggle }) => {
  const [isOn, setIsOn] = useState(status === 'connected'); // Initialize toggle based on status

  const handleToggle = () => {
    setIsOn(!isOn);
    onToggle(); // Trigger parent handler to update status in backend
  };

  return (
    <div className="bg-white p-6 w-96 rounded-lg shadow-md">
      <div className="flex justify-between">
        <div className="w-full cursor-pointer" onClick={onClick}>
          <h3 className="font-bold text-2xl mb-4">{power}W</h3>
          <p className="text-md font-semibold">
            <span className="text-sm font-normal ml-1">{unit}</span>
          </p>
        </div>
        <div className="flex items-center">
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

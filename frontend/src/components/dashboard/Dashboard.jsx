// src/components/dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import DeviceCard from './components/DeviceCard';
import DeviceModal from './components/DeviceModal';
import { useDeviceData } from './hooks/deviceHooks';  // Updated path to local hooks

// Header Component
const Header = React.memo(({ user, refreshing, onRefresh, onAddDevice }) => (
  <div className="flex flex-col md:flex-row justify-between items-center mb-8">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Device Dashboard</h1>
      <p className="text-gray-600 mt-1">
        Welcome back, {user?.username || user?.email?.split('@')[0] || 'User'}
      </p>
    </div>

    <div className="flex gap-4 mt-4 md:mt-0">
      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={refreshing}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
      >
        <RefreshCw
          className={`-ml-1 mr-2 h-5 w-5 ${refreshing ? 'animate-spin' : ''} transition-transform`}
        />
        {refreshing ? 'Refreshing...' : 'Refresh'}
      </button>

      {/* Add Device Button */}
      <button
        onClick={onAddDevice}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
        Add Device
      </button>
    </div>
  </div>
));

Header.displayName = 'Header';

// Empty State Component
const EmptyState = React.memo(({ onAddDevice }) => (
  <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm">
    <PlusCircle className="mx-auto h-12 w-12 text-gray-400" />
    <h3 className="mt-2 text-sm font-medium text-gray-900">No devices found</h3>
    <p className="mt-1 text-sm text-gray-500">
      Get started by adding a new device to monitor.
    </p>
    <div className="mt-6">
      <button
        onClick={onAddDevice}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
      >
        <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
        Add Device
      </button>
    </div>
  </div>
));

EmptyState.displayName = 'EmptyState';

// Loading Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

// Error Component
const ErrorAlert = React.memo(({ message, onRetry }) => (
  <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
        <span className="text-red-700">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-red-600 hover:text-red-800 focus:outline-none"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
));

ErrorAlert.displayName = 'ErrorAlert';

// Main Dashboard Component
const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    devices,
    loading,
    error,
    fetchDevices,
    toggleDeviceStatus,
    addDevice,
    cleanup
  } = useDeviceData();

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Initial data fetch and polling setup
  useEffect(() => {
    if (user) {
      const loadData = async () => {
        setRefreshing(true);
        await fetchDevices();
        setRefreshing(false);
      };

      loadData();

      // Set up polling
      const pollInterval = setInterval(async () => {
        await fetchDevices(false); // Don't show loading state for polling
      }, 30000);

      // Cleanup
      return () => {
        clearInterval(pollInterval);
        cleanup();
      };
    }
  }, [user, fetchDevices, cleanup]);

  // Event Handlers
  const handleDeviceToggle = async (deviceId, isOn) => {
    await toggleDeviceStatus(deviceId, isOn);
  };

  const handleDeviceSelect = (deviceId) => {
    navigate(`/detail/${deviceId}`);
  };

  const handleDeviceAdd = async (deviceData) => {
    const success = await addDevice(deviceData);
    if (success) {
      setIsModalOpen(false);
      await fetchDevices(); // Refresh the list
    }
    return success;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
  };

  // Loading state
  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Header
          user={user}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onAddDevice={() => setIsModalOpen(true)}
        />

        {/* Error Display */}
        {error && (
          <ErrorAlert 
            message={error} 
            onRetry={handleRefresh}
          />
        )}

        {/* Content */}
        {loading && devices.length === 0 ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.length === 0 ? (
              <EmptyState onAddDevice={() => setIsModalOpen(true)} />
            ) : (
              devices.map(device => (
                <DeviceCard
                  key={device.deviceId}
                  device={device}
                  onToggle={handleDeviceToggle}
                  onClick={() => handleDeviceSelect(device.deviceId)}
                />
              ))
            )}
          </div>
        )}

        {/* Device Modal */}
        <DeviceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleDeviceAdd}
        />
      </div>
    </div>
  );
};

export default Dashboard;
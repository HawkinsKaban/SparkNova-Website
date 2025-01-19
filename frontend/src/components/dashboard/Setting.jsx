// components/dashboard/Setting.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User, AtSign, Shield } from 'lucide-react';

const Setting = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Show loading state while checking auth
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Profile Settings</h1>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center mb-8 justify-center">
          <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-2xl font-semibold text-white">
            {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg shadow-md">
            <User className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Username</h3>
              <p className="text-md text-gray-600">{user?.username || 'Not available'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg shadow-md">
            <AtSign className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Email</h3>
              <p className="text-md text-gray-600">{user?.email || 'Not available'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg shadow-md">
            <Shield className="w-8 h-8 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Role</h3>
              <p className="text-md text-gray-600">{user?.role || 'User'}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {/* Reset Password Button */}
          <div className="text-center">
            <button
              onClick={() => navigate('/reset')}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Reset Password
            </button>
          </div>

          {/* Log Out Button */}
          <div className="text-center">
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setting;
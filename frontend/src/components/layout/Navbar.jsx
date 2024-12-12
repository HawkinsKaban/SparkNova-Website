import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-4 h-16">
        <div className="flex justify-between items-center h-full">
          {/* Left side */}
          <div className="flex items-center">
            <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <div className="hidden md:block">
              <h1 className="text-xl font-semibold text-gray-800">
                SparkNova Dashboard
              </h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-gray-100">
              <Bell className="h-5 w-5 text-gray-600" />
            </button>

            {/* User & Logout */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-red-50 text-red-600"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden md:block text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
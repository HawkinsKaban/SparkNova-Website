// components/layout/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, LogOut } from 'lucide-react';
import Logo from "../../assets/SparkNova.png";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get display name from user data
  const getDisplayName = () => {
    if (!user) return '';
    return user.username || user.email?.split('@')[0] || 'User';
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-4 h-16">
        <div className="flex justify-between items-center h-full">
          {/* Left side */}
          <div className="flex items-center">
            <button className="hidden p-2 rounded-lg hover:bg-gray-100" aria-label="Open Menu">
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <div 
              className="block cursor-pointer" 
              onClick={() => navigate('/dashboard')}
            >
              <img src={Logo} alt="Logo" className='w-48' />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-gray-100" aria-label="Notifications">
              <Bell className="h-5 w-5 text-gray-600" />
            </button>

            {/* User & Logout */}
            <div className="flex items-center space-x-3">
              <div 
                className="block cursor-pointer" 
                onClick={() => navigate('/settings')}
              >
                <p className="text-sm font-medium text-gray-700">
                  {getDisplayName()}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-red-50 text-red-600"
                aria-label="Logout"
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
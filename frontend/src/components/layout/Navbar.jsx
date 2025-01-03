import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, LogOut } from 'lucide-react';
import Logo from "../../assets/SparkNova.png";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Added error state

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.email) return; // Only proceed if user.email exists

      setLoading(true);
      setError(null); // Reset error state when starting fetch

      try {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.REACT_APP_API_URL; // Use the environment variable

        const response = await axios.get(`${apiUrl}/auth/detail/${user.email}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.user) {
          setUserDetails(response.data.user);
        } else {
          setError('User details not found');
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
        setError('Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [user?.email]);

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
            <button className="hidden p-2 rounded-lg hover:bg-gray-100" aria-label="Open Menu">
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <div className="block" onClick={() => navigate('/dashboard')}>
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
              <div className="block cursor-pointer" onClick={() => navigate('/settings')}>
                {loading ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : error ? (
                  <p className="text-sm text-red-500">{error}</p>
                ) : userDetails ? (
                  <p className="text-sm font-medium text-gray-700">{userDetails.username}</p>
                ) : (
                  <p className="text-sm text-red-500">Error loading details</p>
                )}
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

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (user?.email) {
          const token = localStorage.getItem('token');

          const response = await axios.get(`http://localhost:5000/api/auth/detail/${user.email}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setUserDetails(response.data.user);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
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
            <button className="hidden p-2 rounded-lg hover:bg-gray-100">
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <div className="block">
              <h1 className="text-xl font-semibold text-gray-800 cursor-pointer" onClick={()=>navigate("/dashboard")}>
                SparkNova 
                <span className='hidden md:block'>Dashboard</span>
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
              <div className="block cursor-pointer" onClick={()=>navigate("/settings")}>
                {loading ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : userDetails ? (
                  <p className="text-sm font-medium text-gray-700">
                    {userDetails.username}
                  </p>
                ) : (
                  <p className="text-sm text-red-500">Error loading details</p>
                )}
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

/* eslint-disable */
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { User, AtSign, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};  
  const navigate = useNavigate();

  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  if (!user) {
    return <div className="p-6">User data not found</div>;
  }

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (user?.email) {
          const token = localStorage.getItem('token');
          
          // Use REACT_APP_API_URL from the environment variables
          const apiUrl = process.env.REACT_APP_API_URL; 
          
          // Make sure the environment variable is defined
          if (!apiUrl) {
            console.error('API URL is not defined in the environment variables.');
            return;
          }

          const response = await axios.get(`${apiUrl}/auth/detail/${user.email}`, {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Profile</h1>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center mb-8 justify-center">
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-semibold text-white">
            {userDetails.username ? userDetails.username.charAt(0).toUpperCase() : '?'}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg shadow-md">
            <User className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Username</h3>
              <p className="text-md text-gray-600">{userDetails.username || 'Not available'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg shadow-md">
            <AtSign className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Email</h3>
              <p className="text-md text-gray-600">{userDetails.email || 'Not available'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg shadow-md">
            <Shield className="w-8 h-8 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Role</h3>
              <p className="text-md text-gray-600">{userDetails.role || 'Not available'}</p>
            </div>
          </div>
        </div>

        {/* Button Reset Password */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/reset')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

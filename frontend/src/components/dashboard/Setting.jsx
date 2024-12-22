/* eslint-disable */
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProfilePage = () => {
  const user = JSON.parse(localStorage.getItem('user')) || {};  

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
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">User Details</h3>
            <p className="text-lg"><strong>Username:</strong> {userDetails.username || 'Not available'}</p>
            <p className="text-lg"><strong>Email:</strong> {userDetails.email || 'Not available'}</p>
            <p className="text-lg"><strong>Peran:</strong> {userDetails.peran || 'Not available'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

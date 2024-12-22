/* eslint-disable */
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react'; // Mengimpor ikon mata

const ResetPasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false); // State untuk toggle current password visibility
  const [showNewPassword, setShowNewPassword] = useState(false); // State untuk toggle new password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State untuk toggle confirm password visibility
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
    
      // Use REACT_APP_API_URL from the environment variables
      const apiUrl = process.env.REACT_APP_API_URL; 

      // Ensure the environment variable is defined
      if (!apiUrl) {
        setErrorMessage('API URL is not defined.');
        return;
      }

      const response = await axios.post(
        `${apiUrl}/auth/reset-password`, // Use the API URL from environment variables
        { currentPassword, newPassword, confirmPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response);
      
      if (response.data.success) {
        setSuccessMessage('Password reset successfully!');
        setTimeout(() => {
          navigate('/profile'); // Navigate kembali ke halaman profil setelah berhasil
        }, 2000);
      } else {
        setErrorMessage(response.data.message || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Reset Password</h1>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password Field */}
          <div className="relative">
            <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700">Current Password</label>
            <input
              type={showCurrentPassword ? 'text' : 'password'} // Toggle antara text dan password
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform "
            >
              {showCurrentPassword ? <EyeOff className="w-6 h-6 text-gray-600" /> : <Eye className="w-6 h-6 text-gray-600" />}
            </button>
          </div>

          {/* New Password Field */}
          <div className="relative">
            <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700">New Password</label>
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform"
            >
              {showNewPassword ? <EyeOff className="w-6 h-6 text-gray-600" /> : <Eye className="w-6 h-6 text-gray-600" />}
            </button>
          </div>

          {/* Confirm Password Field */}
          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">Confirm Password</label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform "
            >
              {showConfirmPassword ? <EyeOff className="w-6 h-6 text-gray-600" /> : <Eye className="w-6 h-6 text-gray-600" />}
            </button>
          </div>

          {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
          {successMessage && <div className="text-green-500 text-sm">{successMessage}</div>}

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

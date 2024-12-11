// src/services/api.js
import axios from 'axios';

const API_URL = 'https://sparknova-api.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Energy data services
export const getEnergyData = async () => {
  try {
    const response = await api.get('/energy/current');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch energy data';
  }
};

export const getEnergyHistory = async () => {
  try {
    const response = await api.get('/energy/history');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch energy history';
  }
};

// Device control services
export const toggleRelay = async (status) => {
  try {
    const response = await api.post('/devices/relay', { status });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to toggle relay';
  }
};

// Auth services
export const loginUser = async (credentials) => {
    try {
      console.log('Attempting login with:', credentials);
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      console.log('Login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error.response?.data?.message || 'Login failed';
    }
  };
  
  export const registerUser = async (userData) => {
    try {
      console.log('Sending registration request:', userData);
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      console.log('Registration response:', response.data);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error details:', error.response?.data);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Registration failed. Please try again.');
      }
    }
  };
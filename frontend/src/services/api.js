// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

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
export const getEnergyData = async (deviceId) => {
  try {
    const response = await api.get(`/energy/statistics/${deviceId}/daily`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch energy data';
  }
};

export const getEnergyHistory = async (deviceId, from, to) => {
  try {
    const response = await api.get(`/energy/history/${deviceId}`, {
      params: { from, to }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch energy history';
  }
};

// Device control services
export const toggleRelay = async (deviceId, status) => {
  try {
    const response = await api.put(`/devices/${deviceId}/relay`, { 
      relayStatus: status 
    });
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
    return response.data;
  } catch (error) {
    console.error('Registration error details:', error.response?.data);
    throw error.response?.data?.message || 'Registration failed';
  }
};
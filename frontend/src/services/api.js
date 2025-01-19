// services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Validation utilities
export const validation = {
  email: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },
  password: (password) => {
    return {
      length: password.length >= 6,
      hasNumber: /\d/.test(password),
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password)
    };
  }
};

// Auth services
export const authService = {
  login: async (credentials) => {
    try {
      console.log('Login attempt:', { email: credentials.email });
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      console.log('Login response:', response.data);

      if (response.data.success) {
        const { token, user } = response.data.data;
        // Store auth data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return {
          success: true,
          data: { user, token }
        };
      }

      return {
        success: false,
        message: response.data.message || 'Login failed'
      };
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to process request');
    }
  },

  resetPassword: async (token, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password/${token}`, { password });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// Device services
export const deviceService = {
  getAllDevices: async () => {
    try {
      const response = await api.get('/devices');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch devices');
    }
  },

  getDeviceById: async (deviceId) => {
    try {
      const response = await api.get(`/devices/${deviceId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch device');
    }
  },

  registerDevice: async (deviceData) => {
    try {
      const response = await api.post('/devices', deviceData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to register device');
    }
  },

  updateDevice: async (deviceId, updateData) => {
    try {
      const response = await api.put(`/devices/${deviceId}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update device');
    }
  },

  deleteDevice: async (deviceId) => {
    try {
      const response = await api.delete(`/devices/${deviceId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete device');
    }
  },

  controlRelay: async (deviceId, state) => {
    try {
      console.log('Controlling relay:', { deviceId, state });
      const response = await api.put(`/devices/${deviceId}/relay`, { state });
      console.log('Relay control response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error controlling relay:', error);
      throw new Error(error.response?.data?.message || 'Failed to control relay');
    }
  }
};

// Energy monitoring services
// Energy monitoring services
export const energyService = {
  // Get latest reading with detailed error handling
  getLatestReading: async (deviceId) => {
    try {
      console.log(`[EnergyService] Fetching latest reading for device ${deviceId}`);
      const response = await api.get(`/energy/readings/${deviceId}/latest`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch latest reading');
      }

      console.log('[EnergyService] Latest reading:', response.data);
      return response.data;
    } catch (error) {
      console.error('[EnergyService] Error fetching latest reading:', {
        deviceId,
        error: error.message,
        details: error.response?.data
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch latest reading');
    }
  },

  // Get readings with time range support
  getReadings: async (deviceId, params = {}) => {
    try {
      const { startTime, endTime, period = 'daily' } = params;
      console.log(`[EnergyService] Fetching readings for device ${deviceId}`, { startTime, endTime, period });

      const queryParams = {
        ...(startTime && { from: startTime }),
        ...(endTime && { to: endTime }),
        period
      };

      const response = await api.get(`/energy/readings/${deviceId}`, { params: queryParams });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch readings');
      }

      console.log('[EnergyService] Readings fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('[EnergyService] Error fetching readings:', {
        deviceId,
        params,
        error: error.message,
        details: error.response?.data
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch readings');
    }
  },

  // Get statistics with period validation
  getStatistics: async (deviceId, period = 'daily') => {
    try {
      // Validate period
      const validPeriods = ['hourly', 'daily', 'weekly', 'monthly'];
      if (!validPeriods.includes(period)) {
        throw new Error(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
      }

      console.log(`[EnergyService] Fetching statistics for device ${deviceId}, period: ${period}`);
      const response = await api.get(`/energy/statistics/${deviceId}/${period}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch statistics');
      }

      console.log('[EnergyService] Statistics:', response.data);
      return response.data;
    } catch (error) {
      console.error('[EnergyService] Error fetching statistics:', {
        deviceId,
        period,
        error: error.message,
        details: error.response?.data
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch statistics');
    }
  },

  // Get usage history with enhanced params
  getUsageHistory: async (deviceId, params = {}) => {
    try {
      const { startTime, endTime, period = 'daily', aggregation = 'hour' } = params;
      console.log(`[EnergyService] Fetching usage history for device ${deviceId}`, params);

      const queryParams = {
        ...(startTime && { from: startTime }),
        ...(endTime && { to: endTime }),
        period,
        aggregation
      };

      const response = await api.get(`/energy/readings/${deviceId}/${period}`, { params: queryParams });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch usage history');
      }

      console.log('[EnergyService] Usage history:', response.data);
      return response.data;
    } catch (error) {
      console.error('[EnergyService] Error fetching usage history:', {
        deviceId,
        params,
        error: error.message,
        details: error.response?.data
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch usage history');
    }
  },

  // Record new reading with validation
  recordReading: async (deviceId, readingData) => {
    try {
      // Validate required fields
      const requiredFields = ['power', 'energy', 'voltage', 'current'];
      const missingFields = requiredFields.filter(field => !readingData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      console.log('[EnergyService] Recording reading:', { deviceId, readingData });
      
      const response = await api.post('/energy/readings', {
        deviceId,
        timestamp: new Date().toISOString(),
        ...readingData
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to record reading');
      }

      console.log('[EnergyService] Reading recorded:', response.data);
      return response.data;
    } catch (error) {
      console.error('[EnergyService] Error recording reading:', {
        deviceId,
        readingData,
        error: error.message,
        details: error.response?.data
      });
      throw new Error(error.response?.data?.message || 'Failed to record reading');
    }
  },

  // Get cost analysis
  getCosts: async (deviceId, period = 'daily') => {
    try {
      console.log(`[EnergyService] Fetching costs for device ${deviceId}, period: ${period}`);
      const response = await api.get(`/energy/costs/${deviceId}/${period}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch costs');
      }

      console.log('[EnergyService] Costs:', response.data);
      return response.data;
    } catch (error) {
      console.error('[EnergyService] Error fetching costs:', {
        deviceId,
        period,
        error: error.message,
        details: error.response?.data
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch costs');
    }
  },

  getPredictions: async (deviceId, params = {}) => {
    try {
      console.log(`[EnergyService] Fetching predictions for device ${deviceId}`);
      const { period = 'monthly', method = 'average' } = params;

      const response = await api.get(`/energy/predictions/${deviceId}`, {
        params: {
          period,
          method
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch predictions');
      }

      console.log('[EnergyService] Predictions:', response.data);
      return response.data;
    } catch (error) {
      console.error('[EnergyService] Error fetching predictions:', {
        deviceId,
        error: error.message,
        details: error.response?.data
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch predictions');
    }
  },

  // Get readings history
  getReadingsHistory: async (deviceId, period = 'daily') => {
    try {
      console.log(`[EnergyService] Fetching readings history for device ${deviceId}, period: ${period}`);
      const response = await api.get(`/energy/readings/${deviceId}/${period}`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch readings history');
      }

      console.log('[EnergyService] Readings history:', response.data);
      return response.data;
    } catch (error) {
      console.error('[EnergyService] Error fetching readings history:', {
        deviceId,
        period,
        error: error.message,
        details: error.response?.data
      });
      throw new Error(error.response?.data?.message || 'Failed to fetch readings history');
    }
  }
};

// Alert services
export const alertService = {
  getAlerts: async (deviceId, params) => {
    try {
      const response = await api.get(`/alerts/${deviceId}`, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch alerts');
    }
  },

  createAlert: async (alertData) => {
    try {
      const response = await api.post('/alerts', alertData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create alert');
    }
  },

  resolveAlert: async (alertId) => {
    try {
      const response = await api.put(`/alerts/${alertId}/resolve`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to resolve alert');
    }
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
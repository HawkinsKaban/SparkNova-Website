// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

// Create auth context
const AuthContext = createContext(null);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Check for existing user data and token
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
          // Parse and set user data
          const userData = JSON.parse(savedUser);
          console.log('Loaded user data:', userData);
          setUser(userData);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        // Clear potentially corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Handle user login
  const login = async (credentials) => {
    setError(null);
    try {
      console.log('Attempting login with credentials:', credentials);
      const response = await authService.login(credentials);
      
      if (response.success) {
        const { user: userData, token } = response.data;
        // Store user data and token
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        console.log('Login successful. User:', userData);
        return { success: true };
      }

      throw new Error(response.message || 'Login failed');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Handle user registration
  const register = async (userData) => {
    setError(null);
    try {
      console.log('Attempting registration with data:', userData);
      const response = await authService.register(userData);
      
      if (response.success) {
        console.log('Registration successful');
        return { success: true };
      }

      throw new Error(response.message || 'Registration failed');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Handle user logout
  const logout = () => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!user && !!token;
  };

  // Handle password reset request
  const forgotPassword = async (email) => {
    setError(null);
    try {
      const response = await authService.forgotPassword(email);
      return { success: true, message: response.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Handle password reset
  const resetPassword = async (token, password) => {
    setError(null);
    try {
      const response = await authService.resetPassword(token, password);
      return { success: true, message: response.message };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Get current user
  const getCurrentUser = () => {
    return user;
  };

  // Update user profile
  const updateProfile = async (userData) => {
    setError(null);
    try {
      const response = await authService.updateProfile(userData);
      if (response.success) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        return { success: true };
      }
      throw new Error(response.message || 'Failed to update profile');
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  // Create the auth context value
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    isAuthenticated,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    updateProfile,
    setError
  };

  // Show loading state while initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
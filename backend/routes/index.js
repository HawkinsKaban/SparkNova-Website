const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const deviceRoutes = require('./deviceRoutes');
const energyRoutes = require('./energyRoutes');
const alertRoutes = require('./alertRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'System is healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/energy', energyRoutes);
router.use('/alerts', alertRoutes);

// Handle 404 routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = router;
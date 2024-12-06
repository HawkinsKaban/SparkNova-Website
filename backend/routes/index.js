const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const perangkatRoutes = require('./perangkatRoutes');
const energyRoutes = require('./energyRoutes');
const peringatanRoutes = require('./peringatanRoutes');

// Auth routes
router.use('/auth', authRoutes);

// Perangkat routes
router.use('/perangkat', perangkatRoutes);

// Energy monitoring routes
router.use('/energy', energyRoutes);

// Peringatan routes
router.use('/peringatan', peringatanRoutes);

module.exports = router;
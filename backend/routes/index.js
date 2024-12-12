// routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const deviceRoutes = require('./deviceRoutes');
const energyRoutes = require('./energyRoutes');
const alertRoutes = require('./alertRoutes');

router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);
router.use('/energy', energyRoutes);
router.use('/alerts', alertRoutes);

module.exports = router;
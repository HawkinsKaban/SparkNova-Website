// routes/energyRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const energyController = require('../controllers/energyController');

router.use(protect);

// Energy readings
router.post('/readings', energyController.recordEnergyReading);
router.get('/readings/:deviceId', energyController.getUsageHistory);

// Statistics
router.get('/statistics/:deviceId/:period', energyController.getUsageStatistics);

// Historical data
router.get('/history/:deviceId', energyController.getUsageHistory);

module.exports = router;
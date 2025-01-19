const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const EnergyController = require('../controllers/energyController');
const { validatePeriod, validateDateRange } = require('../middleware/validation');

// Apply authentication middleware
router.use(protect);

// Basic reading routes
router.route('/readings')
  .post(EnergyController.recordReading);

router.route('/readings/:deviceId/latest')
  .get(EnergyController.getLatestReading);

router.route('/readings/:deviceId/:period')
  .get(validatePeriod, EnergyController.getUsageHistory);

// Statistics routes
router.route('/statistics/:deviceId/:period')
  .get(validatePeriod, EnergyController.getEnergyStatistics);

// Cost analysis routes
router.route('/costs/:deviceId/:period')
  .get(validatePeriod, EnergyController.getCostAnalysis);

// Export routes
router.route('/export/:deviceId')
  .get(validateDateRange, EnergyController.exportEnergyData);

// Analysis routes
router.route('/predictions/:deviceId')
  .get(EnergyController.getPredictions);

module.exports = router;
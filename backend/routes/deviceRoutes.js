// routes/deviceRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const deviceController = require('../controllers/deviceController');
const settingsController = require('../controllers/settingsController');

router.use(protect);

// Device routes
router.route('/')
  .post(deviceController.registerDevice)
  .get(deviceController.getAllDevices);

router.route('/:deviceId')
  .get(deviceController.getDevice)
  .put(deviceController.updateDevice)
  .delete(deviceController.deleteDevice);

router.route('/:deviceId/relay')
  .put(deviceController.updateRelayStatus);

// Settings routes
router.route('/:deviceId/settings')
  .get(settingsController.getSettings)
  .put(settingsController.updateSettings);

router.route('/:deviceId/settings/wifi')
  .put(settingsController.updateWifiConfig);

router.route('/:deviceId/settings/reset')
  .post(settingsController.resetToDefault);

module.exports = router;
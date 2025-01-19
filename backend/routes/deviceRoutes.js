const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const DeviceController = require('../controllers/deviceController');
const { validateDeviceRegistration, validateDeviceUpdate } = require('../middleware/validation');

// Apply authentication middleware
router.use(protect);

// Device Routes
router.route('/')
  .get(DeviceController.getAllDevices)
  .post(validateDeviceRegistration, DeviceController.registerDevice);

// Device Control
router.route('/:deviceId')
  .get(DeviceController.getDevice)
  .put(validateDeviceUpdate, DeviceController.updateDevice)
  .delete(DeviceController.deleteDevice);

// Device Status & Control
router.put('/:deviceId/relay', DeviceController.controlRelay);

// Device Health & Monitoring
router.get('/:deviceId/health', DeviceController.getDeviceHealth);
router.get('/:deviceId/uptime', DeviceController.getUptimeHistory);

// Device Configuration
router.route('/:deviceId/config')
  .get(DeviceController.getDeviceConfig)
  .put(validateDeviceUpdate, DeviceController.updateDeviceConfig);

module.exports = router;
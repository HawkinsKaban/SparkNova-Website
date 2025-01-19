const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const AlertController = require('../controllers/alertController');
const { validateAlert } = require('../middleware/validation');

// Apply authentication middleware
router.use(protect);

// Get alerts overview
router.get('/overview', AlertController.getAlertOverview);

// Device specific alerts
router.route('/:deviceId')
  .get(AlertController.getAlerts)
  .post(validateAlert, AlertController.createAlert);

router.get('/:deviceId/stats', AlertController.getAlertStats);

// Alert management
router.route('/:alertId')
  .get(AlertController.getAlertById)
  .delete(AlertController.deleteAlert);

router.put('/:alertId/resolve', AlertController.resolveAlert);

module.exports = router ;
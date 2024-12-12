// routes/alertRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const alertController = require('../controllers/alertController');

router.use(protect);

// Get all user's alerts and summary
router.get('/user/all', alertController.getAllUserAlerts);
router.get('/user/summary', alertController.getUserAlertsSummary);

// Get routes
router.get('/:deviceId', alertController.getAlerts);
router.get('/:deviceId/stats', alertController.getAlertStats);
router.get('/detail/:alertId', alertController.getAlertById);

// Create route
router.post('/', alertController.createAlert);

// Update routes
router.put('/:alertId', alertController.updateAlert);
router.put('/:alertId/resolve', alertController.resolveAlert);

// Delete route
router.delete('/:alertId', alertController.deleteAlert);

module.exports = router;
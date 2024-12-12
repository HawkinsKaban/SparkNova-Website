// routes/alertRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const alertController = require('../controllers/alertController');

router.use(protect);

router.get('/:deviceId', alertController.getAlerts);
router.put('/:alertId/resolve', alertController.resolveAlert);

module.exports = router;

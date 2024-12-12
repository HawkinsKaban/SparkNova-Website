// controllers/alertController.js
const { Alert, Device } = require('../models');
const mongoose = require('mongoose');

exports.getAlerts = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { isActive } = req.query;

    // Check device ownership
    const device = await Device.findOne({
      deviceId,
      userId: req.user._id
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Build query
    const query = { deviceId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Get alerts with pagination
    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(alertId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert ID format'
      });
    }

    // Find alert
    const alert = await Alert.findById(alertId);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    // Check device ownership
    const device = await Device.findOne({
      deviceId: alert.deviceId,
      userId: req.user._id
    });

    if (!device) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this alert'
      });
    }

    // Update alert status
    alert.isActive = false;
    alert.resolvedAt = new Date();
    await alert.save();

    res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

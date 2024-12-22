// controllers/alertController.js
const { Alert, Device } = require('../models');
const mongoose = require('mongoose');

// Get all alerts with filtering and pagination
exports.getAlerts = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { isActive, type, page = 1, limit = 10 } = req.query;

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
    if (type) {
      query.type = type;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get alerts with pagination
    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      Alert.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: alerts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get single alert by ID
exports.getAlertById = async (req, res) => {
  try {
    const { alertId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(alertId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert ID format'
      });
    }

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

// Create new alert
exports.createAlert = async (req, res) => {
  try {
    const { deviceId, type, message } = req.body;

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

    const alert = await Alert.create({
      deviceId,
      type,
      message,
      isActive: true
    });

    res.status(201).json({
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

// Update alert details
exports.updateAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { type, message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(alertId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert ID format'
      });
    }

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

    // Update fields
    if (type) alert.type = type;
    if (message) alert.message = message;
    
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

// Delete alert
exports.deleteAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(alertId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert ID format'
      });
    }

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

    await alert.deleteOne();

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get alert statistics
exports.getAlertStats = async (req, res) => {
  try {
    const { deviceId } = req.params;

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

    const stats = await Alert.aggregate([
      { $match: { deviceId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          activeCount: {
            $sum: { $cond: ['$isActive', 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Tambahkan di alertController.js

// Get all alerts from all user's devices
exports.getAllUserAlerts = async (req, res) => {
  try {
    // Get all devices owned by user
    const userDevices = await Device.find({ userId: req.user._id });
    
    // Get device IDs
    const deviceIds = userDevices.map(device => device.deviceId);

    // Get query parameters for filtering
    const { isActive, type, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { deviceId: { $in: deviceIds } };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (type) {
      query.type = type;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get alerts with pagination and device details
    const [alerts, total] = await Promise.all([
      Alert.aggregate([
        { $match: query },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
          $lookup: {
            from: 'devices',
            localField: 'deviceId',
            foreignField: 'deviceId',
            as: 'device'
          }
        },
        {
          $addFields: {
            device: { $arrayElemAt: ['$device', 0] }
          }
        },
        {
          $project: {
            _id: 1,
            deviceId: 1,
            type: 1,
            message: 1,
            isActive: 1,
            resolvedAt: 1,
            createdAt: 1,
            'device.name': 1,
            'device.location': 1
          }
        }
      ]),
      Alert.countDocuments(query)
    ]);

    // Get summary statistics
    const stats = await Alert.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          active: {
            $sum: { 
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        alerts,
        stats,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error in getAllUserAlerts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching alerts'
    });
  }
};

// Get summary of alerts for user dashboard
exports.getUserAlertsSummary = async (req, res) => {
  try {
    // Get all devices owned by user
    const userDevices = await Device.find({ userId: req.user._id });
    const deviceIds = userDevices.map(device => device.deviceId);

    // Get alerts summary grouped by device and type
    const summary = await Alert.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds },
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            deviceId: '$deviceId',
            type: '$type'
          },
          count: { $sum: 1 },
          latestAlert: { $max: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'devices',
          localField: '_id.deviceId',
          foreignField: 'deviceId',
          as: 'device'
        }
      },
      {
        $unwind: '$device'
      },
      {
        $group: {
          _id: '$_id.deviceId',
          deviceName: { $first: '$device.name' },
          location: { $first: '$device.location' },
          alerts: {
            $push: {
              type: '$_id.type',
              count: '$count',
              latestAlert: '$latestAlert'
            }
          },
          totalAlerts: { $sum: '$count' }
        }
      },
      {
        $sort: { totalAlerts: -1 }
      }
    ]);

    // Get overall statistics
    const overallStats = await Alert.aggregate([
      {
        $match: {
          deviceId: { $in: deviceIds }
        }
      },
      {
        $group: {
          _id: null,
          totalAlerts: { $sum: 1 },
          activeAlerts: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          criticalAlerts: {
            $sum: { 
              $cond: [
                { $and: [
                  { $eq: ['$type', 'critical'] },
                  { $eq: ['$isActive', true] }
                ]},
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        deviceSummaries: summary,
        overall: overallStats[0] || {
          totalAlerts: 0,
          activeAlerts: 0,
          criticalAlerts: 0
        }
      }
    });
  } catch (error) {
    console.error('Error in getUserAlertsSummary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching alerts summary'
    });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(alertId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alert ID format'
      });
    }

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
      data: alert,
      message: 'Alert resolved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error resolving alert'
    });
  }
};
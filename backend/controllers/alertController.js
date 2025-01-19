const { Alert, Device } = require('../models');
const { sendSuccess, sendError } = require('../utils/responseHandler');

class AlertController {
  // Get alert overview
  static async getAlertOverview(req, res) {
    try {
      const devices = await Device.find({ userId: req.user._id });
      const deviceIds = devices.map(device => device.deviceId);

      const alerts = await Alert.aggregate([
        {
          $match: {
            deviceId: { $in: deviceIds },
            isActive: true
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]);

      return sendSuccess(res, alerts);
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Get device alerts
  static async getAlerts(req, res) {
    try {
      const { deviceId } = req.params;
      const { isActive, type } = req.query;

      // Check device ownership
      const device = await Device.findOne({
        deviceId,
        userId: req.user._id
      });

      if (!device) {
        return sendError(res, 'Device tidak ditemukan', 404);
      }

      // Build query
      const query = { deviceId };
      if (isActive !== undefined) {
        query.isActive = isActive === 'true';
      }
      if (type) {
        query.type = type;
      }

      const alerts = await Alert.find(query)
        .sort({ createdAt: -1 });

      return sendSuccess(res, alerts);
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Get alert by ID
  static async getAlertById(req, res) {
    try {
      const { alertId } = req.params;

      const alert = await Alert.findById(alertId);
      if (!alert) {
        return sendError(res, 'Alert tidak ditemukan', 404);
      }

      // Check device ownership
      const device = await Device.findOne({
        deviceId: alert.deviceId,
        userId: req.user._id
      });

      if (!device) {
        return sendError(res, 'Tidak memiliki akses ke alert ini', 403);
      }

      return sendSuccess(res, alert);
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Create new alert
  static async createAlert(req, res) {
    try {
      const { deviceId, type, message } = req.body;

      // Check device ownership
      const device = await Device.findOne({
        deviceId,
        userId: req.user._id
      });

      if (!device) {
        return sendError(res, 'Device tidak ditemukan', 404);
      }

      const alert = await Alert.create({
        deviceId,
        type,
        message,
        isActive: true
      });

      return sendSuccess(res, alert, 'Alert berhasil dibuat', 201);
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Delete alert
  static async deleteAlert(req, res) {
    try {
      const { alertId } = req.params;

      const alert = await Alert.findById(alertId);
      if (!alert) {
        return sendError(res, 'Alert tidak ditemukan', 404);
      }

      // Check device ownership
      const device = await Device.findOne({
        deviceId: alert.deviceId,
        userId: req.user._id
      });

      if (!device) {
        return sendError(res, 'Tidak memiliki akses ke alert ini', 403);
      }

      await alert.deleteOne();
      return sendSuccess(res, null, 'Alert berhasil dihapus');
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Resolve alert
  static async resolveAlert(req, res) {
    try {
      const { alertId } = req.params;

      const alert = await Alert.findById(alertId);
      if (!alert) {
        return sendError(res, 'Alert tidak ditemukan', 404);
      }

      // Check device ownership
      const device = await Device.findOne({
        deviceId: alert.deviceId,
        userId: req.user._id
      });

      if (!device) {
        return sendError(res, 'Tidak memiliki akses ke alert ini', 403);
      }

      alert.isActive = false;
      alert.resolvedAt = new Date();
      await alert.save();

      return sendSuccess(res, alert, 'Alert berhasil diselesaikan');
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Get alert statistics
  static async getAlertStats(req, res) {
    try {
      const { deviceId } = req.params;

      // Check device ownership
      const device = await Device.findOne({
        deviceId,
        userId: req.user._id
      });

      if (!device) {
        return sendError(res, 'Device tidak ditemukan', 404);
      }

      const stats = await Alert.aggregate([
        {
          $match: { deviceId }
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: 1 },
            active: {
              $sum: { $cond: ['$isActive', 1, 0] }
            },
            resolved: {
              $sum: { $cond: ['$isActive', 0, 1] }
            }
          }
        }
      ]);

      return sendSuccess(res, stats);
    } catch (error) {
      return sendError(res, error.message);
    }
  }
}

module.exports = AlertController;
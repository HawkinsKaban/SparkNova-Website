const emailService = require('./email/emailService');

class NotificationService {
  static async sendAlertNotification(user, alert) {
    try {
      await emailService.sendEmail({
        email: user.email,
        subject: `Alert: ${alert.type.toUpperCase()} - Device ${alert.deviceId}`,
        message: `
          <h2>Alert Notification</h2>
          <p>Type: ${alert.type}</p>
          <p>Message: ${alert.message}</p>
          <p>Time: ${new Date(alert.createdAt).toLocaleString()}</p>
        `
      });
    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  static async sendDeviceStatusNotification(user, device, status) {
    try {
      await emailService.sendEmail({
        email: user.email,
        subject: `Device Status Update - ${device.name}`,
        message: `
          <h2>Device Status Update</h2>
          <p>Device: ${device.name}</p>
          <p>Status: ${status}</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        `
      });
    } catch (error) {
      console.error('Failed to send device status notification:', error);
    }
  }

  static async sendPowerUsageAlert(user, device, usage) {
    try {
      await emailService.sendEmail({
        email: user.email,
        subject: `High Power Usage Alert - ${device.name}`,
        message: `
          <h2>High Power Usage Alert</h2>
          <p>Device: ${device.name}</p>
          <p>Current Usage: ${usage.power}W</p>
          <p>Threshold: ${usage.threshold}W</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        `
      });
    } catch (error) {
      console.error('Failed to send power usage alert:', error);
    }
  }
}

module.exports = NotificationService;
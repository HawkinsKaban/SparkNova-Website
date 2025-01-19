const emailService = require('./email/emailService');
const EnergyCalculationService = require('./energyCalculation');
const DeviceService = require('./deviceService');
const NotificationService = require('./notificationService');

const initializeServices = async () => {
  try {
    // Verify email service connection
    await emailService.verifyConnection();
    
    // Initialize other services if needed
    console.log('✅ All services initialized successfully');
  } catch (error) {
    console.error('❌ Service initialization error:', error);
    throw error;
  }
};

module.exports = {
  emailService,
  EnergyCalculationService,
  DeviceService,
  NotificationService,
  initializeServices
};
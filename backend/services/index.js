// services/index.js
const emailService = require('./email/emailService');
const EnergyCalculationService = require('./energyCalculation');

module.exports = {
  emailService,
  EnergyCalculationService
};
const ELECTRICITY_RATES = {
  R1_900VA: 1352,
  R1_1300VA: 1444,
  R1_2200VA: 1444,
  R2_3500VA: 1444,
  R3_6600VA: 1444
};

class EnergyCalculationService {
  /**
   * Calculate usage statistics from energy readings and settings
   * @param {Array} readings - Array of energy readings
   * @param {Object} settings - Device settings
   * @returns {Object} Calculated statistics
   */
  static async calculateUsageStatistics(readings, settings) {
    const {
      totalEnergy,
      averagePower,
      maxPower,
      minPower
    } = this.calculateBaseMetrics(readings);

    const {
      baseCost,
      taxCost,
      totalCost
    } = this.calculateCosts(totalEnergy, settings.serviceType, settings.taxRate);

    return {
      totalKwh: totalEnergy,
      averagePower,
      maxPower,
      minPower,
      baseCost,
      taxCost,
      totalCost
    };
  }

  /**
   * Calculate base metrics from readings
   * @param {Array} readings - Array of energy readings
   * @returns {Object} Base metrics
   */
  static calculateBaseMetrics(readings) {
    let totalEnergy = 0;
    let totalPower = 0;
    let maxPower = 0;
    let minPower = Number.MAX_VALUE;

    readings.forEach(reading => {
      totalEnergy += reading.energy;
      totalPower += reading.power;
      maxPower = Math.max(maxPower, reading.power);
      minPower = Math.min(minPower, reading.power);
    });

    const averagePower = readings.length > 0 ? totalPower / readings.length : 0;

    return {
      totalEnergy,
      averagePower,
      maxPower,
      minPower
    };
  }

  /**
   * Calculate costs based on energy usage
   * @param {number} totalEnergy - Total energy used in kWh
   * @param {string} serviceType - Type of service (R1_900VA, etc.)
   * @param {number} taxRate - Tax rate percentage
   * @returns {Object} Cost calculations
   */
  static calculateCosts(totalEnergy, serviceType, taxRate) {
    const ratePerKwh = ELECTRICITY_RATES[serviceType];
    if (!ratePerKwh) {
      throw new Error(`Invalid service type: ${serviceType}`);
    }

    const baseCost = totalEnergy * ratePerKwh;
    const taxCost = baseCost * (taxRate / 100);
    const totalCost = baseCost + taxCost;

    return {
      baseCost,
      taxCost,
      totalCost
    };
  }

  /**
   * Get time range for specified period
   * @param {string} period - Period type ('daily', 'weekly', 'monthly')
   * @returns {Object} Start and end time for the period
   */
  static getTimeRange(period) {
    const now = new Date();
    let startTime = new Date(now);

    switch (period) {
      case 'daily':
        startTime.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startTime.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startTime.setMonth(now.getMonth() - 1);
        break;
      default:
        throw new Error(`Invalid period: ${period}`);
    }

    return {
      startTime,
      endTime: now
    };
  }

  /**
   * Validate time range input
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time
   * @throws {Error} If time range is invalid
   */
  static validateTimeRange(startTime, endTime) {
    if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
      throw new Error('Invalid date format');
    }

    if (startTime > endTime) {
      throw new Error('Start time cannot be after end time');
    }

    if (endTime > new Date()) {
      throw new Error('End time cannot be in the future');
    }
  }
}

module.exports = EnergyCalculationService;
const moment = require('moment-timezone');

class TimeUtils {
  static #TIMEZONE = 'Asia/Jakarta';
  static #WIB_HOURS = 7; // WIB is UTC+7

  /**
   * Get time range with WIB adjustment
   * @param {string} period - Time period ('daily', 'weekly', 'monthly')
   * @returns {Object} Time range with WIB times
   */
  static getTimeRange(period) {
    try {
      // Get current time and add 7 hours for WIB
      const now = moment().add(this.#WIB_HOURS, 'hours');
      
      // Create end time
      const endTime = now.clone();
      
      // Create start time and adjust based on period
      const startTime = now.clone();
      switch (period.toLowerCase()) {
        case 'daily':
          startTime.subtract(24, 'hours');
          break;
        case 'weekly':
          startTime.subtract(7, 'days');
          break;
        case 'monthly':
          startTime.subtract(1, 'month');
          break;
        default:
          throw new Error(`Invalid period: ${period}`);
      }

      return {
        // UTC dates for database
        startTime: startTime.toDate(),
        endTime: endTime.toDate(),
        period,
        // Formatted times for API response
        formatted: {
          startTime: this.formatWithWIBOffset(startTime),
          endTime: this.formatWithWIBOffset(endTime)
        }
      };
    } catch (error) {
      console.error('Error in getTimeRange:', error);
      throw error;
    }
  }

  /**
   * Format a moment with WIB offset
   * @param {moment} momentObj - Moment object to format
   * @returns {string} Formatted date with WIB offset
   */
  static formatWithWIBOffset(momentObj) {
    return momentObj.format('YYYY-MM-DDTHH:mm:ss.SSS[+07:00]');
  }

  /**
   * Get empty time range
   * @param {string} period - Time period
   * @returns {Object} Empty time range
   */
  static getEmptyTimeRange(period) {
    const range = this.getTimeRange(period);
    return {
      startTime: range.startTime,
      endTime: range.endTime,
      period,
      formatted: range.formatted
    };
  }

  /**
   * Format a UTC date to WIB
   * @param {Date} date - UTC date
   * @returns {string} WIB formatted string
   */
  static formatToWIB(date) {
    const wibTime = moment(date).add(this.#WIB_HOURS, 'hours');
    return this.formatWithWIBOffset(wibTime);
  }
}

module.exports = TimeUtils;
// middleware/validation.js
const { check, param, query, validationResult } = require('express-validator');

/**
 * Base validator handler
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Authentication Validations
 */
const validateRegistration = [
  check('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username harus 3-30 karakter')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username hanya boleh mengandung huruf, angka, dan underscore'),

  check('email')
    .isEmail()
    .withMessage('Format email tidak valid')
    .normalizeEmail(),

  check('password')
    .isLength({ min: 6 })
    .withMessage('Password minimal 6 karakter')
    .matches(/\d/)
    .withMessage('Password harus mengandung angka')
    .matches(/[a-z]/)
    .withMessage('Password harus mengandung huruf kecil')
    .matches(/[A-Z]/)
    .withMessage('Password harus mengandung huruf besar'),

  validate
];

const validateLogin = [
  check('email')
    .isEmail()
    .withMessage('Format email tidak valid')
    .normalizeEmail(),

  check('password')
    .notEmpty()
    .withMessage('Password harus diisi'),

  validate
];

const validatePasswordReset = [
  check('currentPassword')
    .notEmpty()
    .withMessage('Password saat ini harus diisi'),

  check('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password baru minimal 6 karakter')
    .matches(/\d/)
    .withMessage('Password baru harus mengandung angka')
    .matches(/[a-z]/)
    .withMessage('Password baru harus mengandung huruf kecil')
    .matches(/[A-Z]/)
    .withMessage('Password baru harus mengandung huruf besar')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('Password baru harus berbeda');
      }
      return true;
    }),

  check('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Konfirmasi password tidak cocok');
      }
      return true;
    }),

  validate
];

/**
 * Device Validations
 */
const validateDeviceRegistration = [
  check('deviceId')
    .trim()
    .notEmpty()
    .withMessage('Device ID harus diisi')
    .isAlphanumeric()
    .withMessage('Device ID hanya boleh mengandung huruf dan angka'),

  check('name')
    .trim()
    .notEmpty()
    .withMessage('Nama device harus diisi')
    .isLength({ max: 100 })
    .withMessage('Nama device maksimal 100 karakter'),

  check('serviceType')
    .optional()
    .isIn(['R1_900VA', 'R1_1300VA', 'R1_2200VA', 'R2_3500VA', 'R3_6600VA'])
    .withMessage('Tipe layanan tidak valid'),

  validate
];

const validateDeviceUpdate = [
  check('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Nama device maksimal 100 karakter'),

  check('powerLimit')
    .optional()
    .isFloat({ min: 100, max: 5000 })
    .withMessage('Power limit harus antara 100W dan 5000W'),

  check('currentLimit')
    .optional()
    .isFloat({ min: 1, max: 20 })
    .withMessage('Current limit harus antara 1A dan 20A'),

  check('warningThreshold')
    .optional()
    .isFloat({ min: 50, max: 95 })
    .withMessage('Warning threshold harus antara 50% dan 95%'),

  check('serviceType')
    .optional()
    .isIn(['R1_900VA', 'R1_1300VA', 'R1_2200VA', 'R2_3500VA', 'R3_6600VA'])
    .withMessage('Tipe layanan tidak valid'),

  validate
];

/**
 * Energy Validations
 */
const validateEnergyReading = [
  check('deviceId')
    .notEmpty()
    .withMessage('Device ID harus diisi')
    .isString()
    .withMessage('Device ID harus berupa string'),

  check('timestamp')
    .notEmpty()
    .withMessage('Timestamp harus diisi')
    .isISO8601()
    .withMessage('Format timestamp tidak valid'),

  check('readings.voltage')
    .isFloat({ min: 0, max: 500 })
    .withMessage('Voltage harus antara 0-500V'),

  check('readings.current')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Current harus antara 0-100A'),

  check('readings.power')
    .isFloat({ min: 0 })
    .withMessage('Power harus berupa angka positif'),

  check('readings.energy')
    .isFloat({ min: 0 })
    .withMessage('Energy harus berupa angka positif'),

  check('readings.frequency')
    .optional()
    .isFloat({ min: 45, max: 65 })
    .withMessage('Frequency harus antara 45-65Hz'),

  check('readings.powerFactor')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Power factor harus antara 0-1'),

  validate
];

const validatePeriod = [
  param('period')
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Period harus daily, weekly, monthly, atau yearly'),
  validate
];

const validateDateRange = [
  query('startDate')
    .notEmpty()
    .withMessage('Start date harus diisi')
    .isISO8601()
    .withMessage('Format start date tidak valid'),

  query('endDate')
    .notEmpty()
    .withMessage('End date harus diisi')
    .isISO8601()
    .withMessage('Format end date tidak valid')
    .custom((endDate, { req }) => {
      const start = new Date(req.query.startDate);
      const end = new Date(endDate);
      if (end < start) {
        throw new Error('End date tidak boleh kurang dari start date');
      }
      if (end > new Date()) {
        throw new Error('End date tidak boleh lebih dari waktu sekarang');
      }
      const maxRange = new Date(start);
      maxRange.setFullYear(start.getFullYear() + 1);
      if (end > maxRange) {
        throw new Error('Range waktu maksimal 1 tahun');
      }
      return true;
    }),
  validate
];

/**
 * Alert Validations
 */
const validateAlert = [
  check('deviceId')
    .notEmpty()
    .withMessage('Device ID harus diisi'),

  check('type')
    .isIn(['warning', 'critical'])
    .withMessage('Tipe alert tidak valid'),

  check('message')
    .notEmpty()
    .withMessage('Pesan alert harus diisi')
    .isLength({ max: 200 })
    .withMessage('Pesan alert maksimal 200 karakter'),

  validate
];

/**
 * Settings Validations
 */
const validateDeviceSettings = [
  check('serviceType')
    .optional()
    .isIn(['R1_900VA', 'R1_1300VA', 'R1_2200VA', 'R2_3500VA', 'R3_6600VA'])
    .withMessage('Tipe layanan tidak valid'),

  check('powerLimit')
    .optional()
    .isFloat({ min: 100, max: 5000 })
    .withMessage('Power limit harus antara 100W dan 5000W'),

  check('warningPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Warning percentage harus antara 0-100%'),

  check('taxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate harus antara 0-100%'),

  validate
];

const validateWifiConfig = [
  check('wifiSSID')
    .notEmpty()
    .withMessage('WiFi SSID harus diisi')
    .isLength({ max: 32 })
    .withMessage('WiFi SSID maksimal 32 karakter'),

  check('wifiPassword')
    .notEmpty()
    .withMessage('WiFi password harus diisi')
    .isLength({ min: 8, max: 64 })
    .withMessage('WiFi password harus 8-64 karakter'),

  validate
];

module.exports = {
  // Authentication
  validateRegistration,
  validateLogin,
  validatePasswordReset,

  // Device
  validateDeviceRegistration,
  validateDeviceUpdate,

  // Energy
  validateEnergyReading,
  validatePeriod,
  validateDateRange,

  // Alert
  validateAlert,

  // Settings
  validateDeviceSettings,
  validateWifiConfig
};
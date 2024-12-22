// controllers/energyController.js
const { 
  EnergyReading, 
  Device, 
  DeviceSettings, 
  Alert,
  UsageStatistics 
} = require('../models');

const EnergyCalculationService = require('../services/energyCalculation');

exports.recordEnergyReading = async (req, res) => {
  try {
    const { deviceId, voltage, current, power, energy, frequency, powerFactor } = req.body;

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    const settings = await DeviceSettings.findOne({ deviceId });
    
    const reading = await EnergyReading.create({
      deviceId,
      voltage,
      current,
      power,
      energy,
      frequency,
      powerFactor
    });

    // Check power threshold
    if (power > settings.powerLimit) {
      await Alert.create({
        deviceId,
        type: 'critical',
        message: `Power usage exceeds limit (${power}W/${settings.powerLimit}W)`
      });
    } else if (power > (settings.powerLimit * settings.warningPercentage / 100)) {
      await Alert.create({
        deviceId,
        type: 'warning',
        message: `Power usage approaching limit (${power}W/${settings.powerLimit}W)`
      });
    }

    // Update device active time
    await Device.findOneAndUpdate(
      { deviceId },
      { 
        lastActive: new Date(),
        connectionStatus: 'connected'
      }
    );

    res.status(201).json({
      success: true,
      data: reading
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getUsageStatistics = async (req, res) => {
  try {
    const { deviceId, period } = req.params;
    
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

    const settings = await DeviceSettings.findOne({ deviceId });
    const { startTime, endTime } = EnergyCalculationService.getTimeRange(period);

    const readings = await EnergyReading.find({
      deviceId,
      readingTime: {
        $gte: startTime,
        $lte: endTime
      }
    });

    const statistics = await EnergyCalculationService.calculateUsageStatistics(
      readings,
      settings
    );

    const newStats = await UsageStatistics.findOneAndUpdate(
      {
        deviceId,
        period,
        startTime,
        endTime
      },
      {
        ...statistics,
        startTime,
        endTime
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: newStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getUsageHistory = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { from, to } = req.query;

    const readings = await EnergyReading.find({
      deviceId,
      readingTime: {
        $gte: new Date(from),
        $lte: new Date(to)
      }
    }).sort({ readingTime: 1 });

    res.json({
      success: true,
      data: readings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// controllers/deviceController.js
const { Device, DeviceSettings } = require('../models');

exports.registerDevice = async (req, res) => {
  try {
    const { deviceId, name, location, serviceType, wifiSSID, wifiPassword } = req.body;

    const deviceExists = await Device.findOne({ deviceId });
    if (deviceExists) {
      return res.status(400).json({
        success: false,
        message: 'Device ID already registered'
      });
    }

    const device = await Device.create({
      userId: req.user._id,
      deviceId,
      name,
      location,
      status: 'configuring'
    });

    await DeviceSettings.create({
      deviceId: device.deviceId,
      serviceType: serviceType || 'R1_900VA',
      powerLimit: 1000.0,
      warningPercentage: 80.0,
      taxRate: 5.0,
      wifiSSID,
      wifiPassword
    });

    console.log(`Device registered: ${deviceId}`);
    
    res.status(201).json({
      success: true,
      data: {
        ...device.toJSON(),
        wifiSSID,
        serviceType
      }
    });
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllDevices = async (req, res) => {
  try {
    console.log('Getting devices for user:', req.user._id);
    
    const devices = await Device.find({ userId: req.user._id })
      .select('-__v')
      .lean();
    
    console.log(`Found ${devices.length} devices`);

    res.json({
      success: true,
      data: devices
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getDevice = async (req, res) => {
  try {
    const device = await Device.findOne({
      deviceId: req.params.deviceId,
      userId: req.user._id
    }).select('-__v');

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const { name, location, status } = req.body;
    console.log(`Updating device: ${req.params.deviceId} for user: ${req.user._id}`);

    const device = await Device.findOneAndUpdate(
      { 
        deviceId: req.params.deviceId,
        userId: req.user._id
      },
      { name, location, status },
      { new: true, runValidators: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    console.log(`Device updated: ${req.params.deviceId}`);

    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error('Device update error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({
      deviceId: req.params.deviceId,
      userId: req.user._id
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Delete associated settings
    await DeviceSettings.deleteOne({ deviceId: req.params.deviceId });
    
    console.log(`Device deleted: ${req.params.deviceId}`);

    res.json({
      success: true,
      message: 'Device successfully deleted'
    });
  } catch (error) {
    console.error('Device deletion error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateRelayStatus = async (req, res) => {
  try {
    const { relayStatus } = req.body;
    
    const device = await Device.findOneAndUpdate(
      {
        deviceId: req.params.deviceId,
        userId: req.user._id
      },
      { relayStatus },
      { new: true, runValidators: true }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    console.log(`Relay status updated for device: ${req.params.deviceId}`);

    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error('Relay status update error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
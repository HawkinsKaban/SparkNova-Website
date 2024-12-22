// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    console.log('Headers:', req.headers); // Debug headers
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('Token found:', token); // Debug token
    } else {
      console.log('No Bearer token in Authorization header');
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Login required'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded); // Debug decoded token

      // Get user with password
      const user = await User.findById(decoded.id).select('+password');
      console.log('User found:', user ? user._id : 'No user'); // Debug user

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      req.user = user;
      next();
    } catch (err) {
      console.error('Token verification error:', err);
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
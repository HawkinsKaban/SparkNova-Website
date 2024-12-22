// controllers/authController.js
const { validationResult } = require('express-validator');
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); 
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

exports.register = async (req, res) => {
  // First, check for validation errors from express-validator middleware
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(error => error.msg)
    });
  }

  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ 
      $or: [
        { username }, 
        { email: email.toLowerCase() }
      ] 
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: userExists.username === username 
          ? 'Username is already taken' 
          : 'Email is already registered'
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    // Handle other unexpected errors
    console.error('Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

exports.login = async (req, res) => {
  // First, check for validation errors from express-validator middleware
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(error => error.msg)
    });
  }

  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login (optional)
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    console.log('Received forgot password request for:', req.body.email);
    
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address'
      });
    }

    // Find user and explicitly include resetPasswordToken fields
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+resetPasswordToken +resetPasswordExpiry');

    if (!user) {
      console.log('No user found with email:', email);
      return res.status(404).json({
        success: false,
        message: 'No account found with that email'
      });
    }

    console.log('User found:', user.email);

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log('Generated reset token');

    // Save reset token and expiry
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = Date.now() + 3600000; // 1 hour

    // Save user with reset token
    try {
      await user.save();
      console.log('Reset token saved to user');
    } catch (saveError) {
      console.error('Error saving reset token:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Error saving reset token'
      });
    }

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    console.log('Reset URL:', resetUrl);

    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #0d6efd;">SparkNova</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>Hello ${user.username},</p>
          <p>You recently requested to reset your password. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #0d6efd; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If you did not request this reset, please ignore this email.</p>
          <p>This link will expire in 1 hour for security purposes.</p>
          <p>Best regards,<br>The SparkNova Team</p>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
          <p>© ${new Date().getFullYear()} SparkNova. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'SparkNova - Password Reset Request',
        message: emailTemplate
      });

      console.log('Password reset email sent successfully');

      return res.json({
        success: true,
        message: 'Password reset instructions have been sent to your email'
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);

      // Reset the token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Error sending password reset email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request'
    });
  }
};


exports.resetPassword = async (req, res) => {
  try {
    console.log('Reset password request received for user:', req.user?._id);
    
    // Check if user exists in request
    if (!req.user) {
      console.log('No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Please login to access this route'
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;
    console.log('Reset password request body received');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Verify current password
    const isPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      console.log('Current password invalid for user:', req.user._id);
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    req.user.password = newPassword;
    await req.user.save();
    console.log('Password updated successfully for user:', req.user._id);

    // Generate new token
    const token = generateToken(req.user._id);

    res.json({
      success: true,
      message: 'Password successfully updated',
      token
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password'
    });
  }
};

exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.json({
      success: true,
      message: 'Valid reset token'
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying reset token'
    });
  }
};

exports.getUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required to fetch user details'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin || null
      }
    });
  } catch (error) {
    console.error('Get User by Email Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user details'
    });
  }
};
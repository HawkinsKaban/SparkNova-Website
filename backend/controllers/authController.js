const { User } = require('../models');
const { emailService } = require('../services');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthController {
  // Helper method untuk generate token
  static generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, { 
      expiresIn: process.env.JWT_EXPIRE 
    });
  }

  // Register
  static async register(req, res) {
    try {
      const { username, email, password } = req.body;

      const userExists = await User.findOne({
        $or: [{ username }, { email: email.toLowerCase() }]
      });

      if (userExists) {
        return sendError(res, 
          userExists.username === username ? 
          'Username sudah digunakan' : 
          'Email sudah terdaftar', 
        400);
      }

      const user = await User.create({
        username,
        email: email.toLowerCase(),
        password
      });

      const token = AuthController.generateToken(user._id);

      return sendSuccess(res, {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }, 'Registrasi berhasil', 201);
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Login
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() })
        .select('+password');

      if (!user || !(await user.comparePassword(password))) {
        return sendError(res, 'Email atau password salah', 401);
      }

      user.lastLogin = new Date();
      await user.save();

      const token = AuthController.generateToken(user._id);

      return sendSuccess(res, {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }, 'Login berhasil');
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Get Profile
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return sendError(res, 'User tidak ditemukan', 404);
      }
      return sendSuccess(res, user);
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Update Profile
  static async updateProfile(req, res) {
    try {
      const { username, email } = req.body;
      const user = await User.findById(req.user._id);

      if (!user) {
        return sendError(res, 'User tidak ditemukan', 404);
      }

      if (username && username !== user.username) {
        const exists = await User.findOne({ username });
        if (exists) {
          return sendError(res, 'Username sudah digunakan', 400);
        }
        user.username = username;
      }

      if (email && email.toLowerCase() !== user.email) {
        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) {
          return sendError(res, 'Email sudah terdaftar', 400);
        }
        user.email = email.toLowerCase();
      }

      await user.save();
      return sendSuccess(res, user, 'Profil berhasil diperbarui');
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Forgot Password
  static async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return sendError(res, 'Email tidak terdaftar', 404);
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiry = Date.now() + 3600000; // 1 jam
      await user.save();

      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

      try {
        await emailService.sendPasswordResetEmail(user, resetUrl);
        return sendSuccess(res, null, 'Email reset password telah dikirim');
      } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();
        return sendError(res, 'Gagal mengirim email reset password');
      }
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Reset Password
  static async resetPassword(req, res) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: Date.now() }
      });

      if (!user) {
        return sendError(res, 'Token tidak valid atau sudah kadaluarsa', 400);
      }

      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();

      return sendSuccess(res, null, 'Password berhasil direset');
    } catch (error) {
      return sendError(res, error.message);
    }
  }

  // Change Password
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select('+password');

      if (!user) {
        return sendError(res, 'User tidak ditemukan', 404);
      }

      if (!(await user.comparePassword(currentPassword))) {
        return sendError(res, 'Password saat ini tidak valid', 401);
      }

      user.password = newPassword;
      await user.save();

      return sendSuccess(res, null, 'Password berhasil diubah');
    } catch (error) {
      return sendError(res, error.message);
    }
  }
}

module.exports = AuthController;
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: options.email,
        subject: options.subject,
        html: options.message
      };

      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      throw new Error(`Error sending email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(user, resetUrl) {
    try {
      await this.sendEmail({
        email: user.email,
        subject: 'Password Reset Request',
        message: `
          <h1>You have requested a password reset</h1>
          <p>Please click the following link to reset your password:</p>
          <a href="${resetUrl}" target="_blank">Reset Password</a>
        `
      });
    } catch (error) {
      throw new Error('Error sending password reset email');
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      throw new Error('Email service verification failed');
    }
  }
}

module.exports = new EmailService();
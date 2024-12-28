// services/email/emailConfig.js
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Function to verify email connection
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('📧 Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error);
    throw error;
  }
};

module.exports = {
  transporter,
  verifyConnection
};
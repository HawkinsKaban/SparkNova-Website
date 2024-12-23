// services/email/emailConfig.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development'
});

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
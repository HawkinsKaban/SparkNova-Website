// utils/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendEmail = async ({ email, subject, message }) => {
  try {
    const mailOptions = {
      from: {
        name: 'SparkNova',
        address: process.env.EMAIL_USERNAME
      },
      to: email,
      subject,
      html: message,
      text: message.replace(/<[^>]*>/g, '')
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

const verifyConnection = () => {
  return new Promise((resolve, reject) => {
    transporter.verify((error, success) => {
      if (error) {
        console.error('Email service error:', error);
        reject(error);
      } else {
        console.log('Email service is ready');
        resolve(success);
      }
    });
  });
};

module.exports = {
  sendEmail,
  verifyConnection
};
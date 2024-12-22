// utils/sendEmail.js
const nodemailer = require('nodemailer');

// Create transporter with more detailed configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true,
  logger: true
});

const sendEmail = async ({ email, subject, message }) => {
  try {
    console.log('Starting email send process...');
    console.log('Sending to:', email);
    console.log('Subject:', subject);

    const mailOptions = {
      from: {
        name: 'SparkNova',
        address: process.env.EMAIL_USERNAME
      },
      to: email,
      subject: subject,
      html: message,
      text: message.replace(/<[^>]*>/g, '') // Strip HTML for plain text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// Test the connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

module.exports = sendEmail;
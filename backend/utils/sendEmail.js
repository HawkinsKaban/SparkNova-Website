// utils/sendEmail.js
const { sendEmail } = require('./emailService');

// Wrapper untuk mengirim email
const sendEmailWrapper = async (options) => {
  try {
    const result = await sendEmail(options);
    console.log('Email sent via sendEmailWrapper');
    return result;
  } catch (error) {
    console.error('Error in sendEmailWrapper:', error);
    throw error;
  }
};

module.exports = sendEmailWrapper;

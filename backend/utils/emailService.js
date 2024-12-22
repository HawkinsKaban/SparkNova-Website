// utils/emailService.js
const nodemailer = require('nodemailer');

// Konfigurasi transporter Nodemailer
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Digunakan untuk pengujian; dihapus jika tidak perlu.
  },
});

// Fungsi untuk mengirim email
const sendEmail = async ({ email, subject, message }) => {
  try {
    const mailOptions = {
      from: {
        name: 'SparkNova',
        address: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME, // Gunakan EMAIL_FROM jika tersedia.
      },
      to: email,
      subject,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #2563eb; text-align: center; margin-bottom: 20px;">SparkNova</h2>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px;">
            <h3 style="color: #1f2937; margin-bottom: 16px;">${subject}</h3>
            <p style="color: #4b5563; line-height: 1.6;">${message}</p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
            <p>If you didn't request this email, please ignore it.</p>
            <p>© ${new Date().getFullYear()} SparkNova. All rights reserved.</p>
          </div>
        </div>
      `,
      text: message.replace(/<[^>]*>/g, ''), // Konversi HTML ke teks biasa.
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

// Fungsi untuk memverifikasi koneksi ke server SMTP
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email service is ready');
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
};

module.exports = {
  sendEmail,
  verifyConnection,
};

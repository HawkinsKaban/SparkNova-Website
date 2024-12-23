// services/email/emailService.js
const { transporter, verifyConnection } = require('./emailConfig');
const { getPasswordResetTemplate, getPasswordChangeConfirmationTemplate } = require('./emailTemplates');

class EmailService {
  async sendEmail({ email, subject, message, priority = 'normal' }) {
    try {
      console.log(`📧 Sending email to: ${email}`);
      
      const mailOptions = {
        from: {
          name: 'SparkNova',
          address: process.env.EMAIL_USERNAME
        },
        to: email,
        subject,
        html: message,
        text: message.replace(/<[^>]*>/g, ''),
        headers: priority === 'high' ? {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        } : {}
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('❌ Email error:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(user, resetUrl) {
    const template = getPasswordResetTemplate(user.username, resetUrl);
    return this.sendEmail({
      email: user.email,
      subject: 'SparkNova - Password Reset Request',
      message: template,
      priority: 'high'
    });
  }

  async sendPasswordChangeConfirmationEmail(user) {
    const template = getPasswordChangeConfirmationTemplate(user.username);
    return this.sendEmail({
      email: user.email,
      subject: 'SparkNova - Password Changed Successfully',
      message: template
    });
  }

  verifyConnection() {
    return verifyConnection();
  }
}

module.exports = new EmailService();
// services/email/emailService.js
const { transporter, verifyConnection } = require('./emailConfig');
const { getPasswordResetTemplate, getPasswordChangeConfirmationTemplate } = require('./emailTemplates');

class EmailService {
  async sendEmail({ email, subject, message, priority = 'normal', retries = 3 }) {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📧 Sending email to ${email} (Attempt ${attempt}/${retries})`);
        
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
        console.error(`❌ Email error (Attempt ${attempt}/${retries}):`, error);
        lastError = error;
        
        // If it's the last attempt, throw the error
        if (attempt === retries) {
          throw new Error(`Failed to send email after ${retries} attempts: ${lastError.message}`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async sendPasswordResetEmail(user, resetUrl) {
    if (!user || !user.email || !user.username) {
      throw new Error('Invalid user data provided for password reset email');
    }
    if (!resetUrl) {
      throw new Error('Reset URL is required for password reset email');
    }

    const template = getPasswordResetTemplate(user.username, resetUrl);
    return this.sendEmail({
      email: user.email,
      subject: 'SparkNova - Password Reset Request',
      message: template,
      priority: 'high'
    });
  }

  async sendPasswordChangeConfirmationEmail(user) {
    if (!user || !user.email || !user.username) {
      throw new Error('Invalid user data provided for password change confirmation email');
    }

    const template = getPasswordChangeConfirmationTemplate(user.username);
    return this.sendEmail({
      email: user.email,
      subject: 'SparkNova - Password Changed Successfully',
      message: template
    });
  }

  async verifyConnection() {
    return verifyConnection();
  }

  async testEmailService() {
    try {
      await this.verifyConnection();
      console.log('📧 Email service connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Email service connection test failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
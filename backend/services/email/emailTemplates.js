// services/email/emailTemplates.js
const getPasswordResetTemplate = (username, resetUrl) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
      <h1 style="color: #0d6efd;">SparkNova</h1>
    </div>
    <div style="padding: 20px;">
      <h2>Password Reset Request</h2>
      <p>Hello ${username},</p>
      <p>You recently requested to reset your password. Click the button below to proceed:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #0d6efd; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>If you did not request this reset, please ignore this email.</p>
      <p>This link will expire in 1 hour for security purposes.</p>
      <p>Best regards,<br>The SparkNova Team</p>
    </div>
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
      <p>© ${new Date().getFullYear()} SparkNova. All rights reserved.</p>
    </div>
  </div>
`;

const getPasswordChangeConfirmationTemplate = (username) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
      <h1 style="color: #0d6efd;">SparkNova</h1>
    </div>
    <div style="padding: 20px;">
      <h2>Password Changed Successfully</h2>
      <p>Hello ${username},</p>
      <p>Your password has been successfully changed.</p>
      <p>If you did not make this change, please contact us immediately.</p>
      <p>Best regards,<br>The SparkNova Team</p>
    </div>
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
      <p>© ${new Date().getFullYear()} SparkNova. All rights reserved.</p>
    </div>
  </div>
`;

module.exports = {
  getPasswordResetTemplate,
  getPasswordChangeConfirmationTemplate
};
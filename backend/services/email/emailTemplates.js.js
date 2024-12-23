// services/email/emailTemplates.js
const getPasswordResetTemplate = (username, resetUrl) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; text-align: center; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="color: #0d6efd; margin: 0;">SparkNova</h1>
    </div>
    
    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #1a1a1a; margin-bottom: 20px;">Password Reset Request</h2>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">Hello ${username},</p>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
        You recently requested to reset your password. Click the button below to proceed:
      </p>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${resetUrl}" 
           style="background-color: #0d6efd; color: white; padding: 14px 28px; 
                  text-decoration: none; border-radius: 6px; font-weight: 600;
                  display: inline-block;">
          Reset Password
        </a>
      </div>
      
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
        If you did not request this reset, please ignore this email.
      </p>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
        This link will expire in 1 hour for security purposes.
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 14px;">
      <p>© ${new Date().getFullYear()} SparkNova. All rights reserved.</p>
    </div>
  </div>
`;

const getPasswordChangeConfirmationTemplate = (username) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; text-align: center; padding: 20px; border-radius: 8px 8px 0 0;">
      <h1 style="color: #0d6efd; margin: 0;">SparkNova</h1>
    </div>
    
    <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="color: #1a1a1a; margin-bottom: 20px;">Password Changed Successfully</h2>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">Hello ${username},</p>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
        Your password has been successfully changed.
      </p>
      <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
        If you did not make this change, please contact us immediately.
      </p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 14px;">
      <p>© ${new Date().getFullYear()} SparkNova. All rights reserved.</p>
    </div>
  </div>
`;

module.exports = {
  getPasswordResetTemplate,
  getPasswordChangeConfirmationTemplate
};
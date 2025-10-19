import nodemailer from 'nodemailer';

// Validate environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  throw new Error('EMAIL_USER and EMAIL_PASS must be defined in environment variables');
}

// Create transporter with more reliable configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:', error);
    console.error('Make sure you are using a Gmail App Password, not your regular password');
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

export const sendVerificationEmail = async (email: string, token: string, fullName: string) => {
  try {
    if (!process.env.FRONTEND_URL) {
      throw new Error('FRONTEND_URL is not defined in environment variables');
    }

    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    const firstName = fullName.split(' ')[0];

    const mailOptions = {
      from: `"Magic Spin Laundry" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '✨ Welcome to Magic Spin Laundry - Verify Your Email',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              background-color: #f4f7fa;
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 30px;
              text-align: center;
              color: #ffffff;
            }
            .header h1 {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
              letter-spacing: -0.5px;
            }
            .header p {
              font-size: 16px;
              opacity: 0.95;
              font-weight: 400;
            }
            .content {
              padding: 40px 30px;
              background: #ffffff;
            }
            .greeting {
              font-size: 20px;
              color: #1a202c;
              margin-bottom: 20px;
              font-weight: 600;
            }
            .message {
              color: #4a5568;
              font-size: 16px;
              margin-bottom: 16px;
              line-height: 1.7;
            }
            .cta-button {
              display: inline-block;
              padding: 16px 36px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 24px 0;
              transition: transform 0.2s, box-shadow 0.2s;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            .cta-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
            }
            .alternative-link {
              background: #f7fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px;
              margin: 24px 0;
            }
            .alternative-link p {
              color: #718096;
              font-size: 13px;
              margin-bottom: 8px;
            }
            .alternative-link a {
              color: #667eea;
              word-break: break-all;
              font-size: 13px;
              text-decoration: none;
            }
            .info-box {
              background: #fff5f5;
              border-left: 4px solid #fc8181;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .info-box p {
              color: #742a2a;
              font-size: 14px;
              margin: 0;
            }
            .features {
              margin: 30px 0;
              padding: 24px;
              background: #f7fafc;
              border-radius: 8px;
            }
            .features h3 {
              color: #2d3748;
              font-size: 18px;
              margin-bottom: 16px;
              font-weight: 600;
            }
            .feature-item {
              display: flex;
              align-items: start;
              margin-bottom: 12px;
              color: #4a5568;
              font-size: 14px;
            }
            .feature-item::before {
              content: "✓";
              color: #48bb78;
              font-weight: bold;
              margin-right: 10px;
              font-size: 16px;
            }
            .footer {
              background: #f7fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              color: #718096;
              font-size: 13px;
              margin-bottom: 8px;
            }
            .social-links {
              margin: 20px 0;
            }
            .social-links a {
              display: inline-block;
              margin: 0 8px;
              color: #667eea;
              text-decoration: none;
              font-size: 13px;
            }
            .divider {
              height: 1px;
              background: #e2e8f0;
              margin: 24px 0;
            }
            @media only screen and (max-width: 600px) {
              .email-wrapper { border-radius: 0; }
              .content { padding: 30px 20px; }
              .header { padding: 30px 20px; }
              .header h1 { font-size: 24px; }
              .cta-button { display: block; text-align: center; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>🧺 Magic Spin Laundry</h1>
              <p>Premium Laundry & Dry Cleaning Service</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hi ${firstName}! 👋</p>
              
              <p class="message">
                Welcome to <strong>Magic Spin Laundry</strong>! We're thrilled to have you join our community of thousands of happy customers who trust us with their laundry.
              </p>
              
              <p class="message">
                To get started and unlock all our premium features, please verify your email address by clicking the button below:
              </p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="cta-button">Verify My Email Address</a>
              </div>
              
              <div class="alternative-link">
                <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
                <a href="${verificationUrl}">${verificationUrl}</a>
              </div>
              
              <div class="info-box">
                <p>⏱️ <strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
              </div>
              
              <div class="features">
                <h3>What's Next? 🚀</h3>
                <div class="feature-item">Schedule your first pickup in under 2 minutes</div>
                <div class="feature-item">Track your laundry in real-time</div>
                <div class="feature-item">Enjoy eco-friendly cleaning solutions</div>
                <div class="feature-item">Get special discounts for first-time users</div>
                <div class="feature-item">Access 24/7 customer support</div>
              </div>
              
              <div class="divider"></div>
              
              <p class="message" style="font-size: 14px; color: #718096;">
                Need help? Our support team is here 24/7. Just reply to this email or contact us at 
                <a href="mailto:support@magicspinlaundry.com" style="color: #667eea; text-decoration: none;">support@magicspinlaundry.com</a>
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Magic Spin Laundry</strong></p>
              <p>Your Trusted Laundry Partner</p>
              
              <div class="social-links">
                <a href="#">Facebook</a> • 
                <a href="#">Instagram</a> • 
                <a href="#">Twitter</a>
              </div>
              
              <p style="margin-top: 16px;">
                123 Laundry Street, Clean City, CC 12345<br>
                Phone: +1 (555) 123-4567
              </p>
              
              <p style="margin-top: 16px; font-size: 12px; color: #a0aec0;">
                © ${new Date().getFullYear()} Magic Spin Laundry. All rights reserved.
              </p>
              
              <p style="font-size: 11px; color: #a0aec0; margin-top: 8px;">
                You received this email because you created an account at Magic Spin Laundry.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (errorMessage.includes('Invalid login')) {
        errorMessage += ' - Make sure you are using a Gmail App Password, not your regular password';
      } else if (errorMessage.includes('ECONNREFUSED')) {
        errorMessage += ' - Cannot connect to Gmail SMTP server. Check your internet connection';
      } else if (errorMessage.includes('ETIMEDOUT')) {
        errorMessage += ' - Connection timeout. Check your firewall settings';
      }
    }
    
    throw new Error(`Failed to send verification email: ${errorMessage}`);
  }
};

export const sendPasswordResetEmail = async (email: string, token: string, fullName: string) => {
  try {
    if (!process.env.FRONTEND_URL) {
      throw new Error('FRONTEND_URL is not defined in environment variables');
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const firstName = fullName.split(' ')[0];

    const mailOptions = {
      from: `"Magic Spin Laundry" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Reset Your Password - Magic Spin Laundry',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              background-color: #f4f7fa;
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 30px;
              text-align: center;
              color: #ffffff;
            }
            .header h1 {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
              letter-spacing: -0.5px;
            }
            .header p {
              font-size: 16px;
              opacity: 0.95;
              font-weight: 400;
            }
            .content {
              padding: 40px 30px;
              background: #ffffff;
            }
            .greeting {
              font-size: 20px;
              color: #1a202c;
              margin-bottom: 20px;
              font-weight: 600;
            }
            .message {
              color: #4a5568;
              font-size: 16px;
              margin-bottom: 16px;
              line-height: 1.7;
            }
            .cta-button {
              display: inline-block;
              padding: 16px 36px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              font-size: 16px;
              margin: 24px 0;
              transition: transform 0.2s, box-shadow 0.2s;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            .cta-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
            }
            .alternative-link {
              background: #f7fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 16px;
              margin: 24px 0;
            }
            .alternative-link p {
              color: #718096;
              font-size: 13px;
              margin-bottom: 8px;
            }
            .alternative-link a {
              color: #667eea;
              word-break: break-all;
              font-size: 13px;
              text-decoration: none;
            }
            .warning-box {
              background: #fff5f5;
              border-left: 4px solid #fc8181;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .warning-box p {
              color: #742a2a;
              font-size: 14px;
              margin: 0;
            }
            .security-box {
              background: #f0fff4;
              border-left: 4px solid #48bb78;
              padding: 16px;
              margin: 24px 0;
              border-radius: 4px;
            }
            .security-box p {
              color: #22543d;
              font-size: 14px;
              margin: 0;
            }
            .security-tips {
              margin: 30px 0;
              padding: 24px;
              background: #f7fafc;
              border-radius: 8px;
            }
            .security-tips h3 {
              color: #2d3748;
              font-size: 18px;
              margin-bottom: 16px;
              font-weight: 600;
            }
            .tip-item {
              display: flex;
              align-items: start;
              margin-bottom: 12px;
              color: #4a5568;
              font-size: 14px;
            }
            .tip-item::before {
              content: "🔒";
              margin-right: 10px;
              font-size: 16px;
            }
            .footer {
              background: #f7fafc;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              color: #718096;
              font-size: 13px;
              margin-bottom: 8px;
            }
            .divider {
              height: 1px;
              background: #e2e8f0;
              margin: 24px 0;
            }
            @media only screen and (max-width: 600px) {
              .email-wrapper { border-radius: 0; }
              .content { padding: 30px 20px; }
              .header { padding: 30px 20px; }
              .header h1 { font-size: 24px; }
              .cta-button { display: block; text-align: center; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <h1>🧺 Magic Spin Laundry</h1>
              <p>Password Reset Request</p>
            </div>
            
            <div class="content">
              <p class="greeting">Hi ${firstName},</p>
              
              <p class="message">
                We received a request to reset the password for your Magic Spin Laundry account associated with <strong>${email}</strong>.
              </p>
              
              <p class="message">
                If you made this request, click the button below to create a new password:
              </p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="cta-button">Reset My Password</a>
              </div>
              
              <div class="alternative-link">
                <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
                <a href="${resetUrl}">${resetUrl}</a>
              </div>
              
              <div class="warning-box">
                <p>⏱️ <strong>Time Sensitive:</strong> This password reset link will expire in 1 hour for your security.</p>
              </div>
              
              <div class="security-box">
                <p>🛡️ <strong>Didn't request this?</strong> If you didn't ask to reset your password, you can safely ignore this email. Your password will remain unchanged.</p>
              </div>
              
              <div class="security-tips">
                <h3>Security Tips 🔐</h3>
                <div class="tip-item">Use a strong, unique password with at least 8 characters</div>
                <div class="tip-item">Combine uppercase, lowercase, numbers, and special characters</div>
                <div class="tip-item">Never share your password with anyone</div>
                <div class="tip-item">Change your password regularly for better security</div>
              </div>
              
              <div class="divider"></div>
              
              <p class="message" style="font-size: 14px; color: #718096;">
                If you're having trouble or suspect unauthorized access to your account, please contact our security team immediately at 
                <a href="mailto:security@magicspinlaundry.com" style="color: #667eea; text-decoration: none;">security@magicspinlaundry.com</a>
              </p>
            </div>
            
            <div class="footer">
              <p><strong>Magic Spin Laundry</strong></p>
              <p>Your Trusted Laundry Partner</p>
              
              <p style="margin-top: 16px;">
                123 Laundry Street, Clean City, CC 12345<br>
                Phone: +1 (555) 123-4567
              </p>
              
              <p style="margin-top: 16px; font-size: 12px; color: #a0aec0;">
                © ${new Date().getFullYear()} Magic Spin Laundry. All rights reserved.
              </p>
              
              <p style="font-size: 11px; color: #a0aec0; margin-top: 8px;">
                This is an automated security email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      if (errorMessage.includes('Invalid login')) {
        errorMessage += ' - Make sure you are using a Gmail App Password, not your regular password';
      } else if (errorMessage.includes('ECONNREFUSED')) {
        errorMessage += ' - Cannot connect to Gmail SMTP server. Check your internet connection';
      } else if (errorMessage.includes('ETIMEDOUT')) {
        errorMessage += ' - Connection timeout. Check your firewall settings';
      }
    }
    
    throw new Error(`Failed to send password reset email: ${errorMessage}`);
  }
};
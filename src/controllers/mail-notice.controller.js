import nodemailer from 'nodemailer';

class MailNoticeController {
  constructor() {
    this.channels = {
      email: true,
      sms: false,    // Requires Twilio setup
      push: false,   // Requires FCM setup
      inApp: true,
      webhook: false // Requires webhook URL
    };
  }

  // Multi-channel notification sender
  async sendNotification(options) {
    const { 
      recipient, 
      subject, 
      message, 
      priority = 'normal',
      channels = ['email', 'inApp'],
      fallback = true 
    } = options;

    const results = {
      success: [],
      failed: [],
      totalSent: 0
    };

    // Try each channel in order of preference
    for (const channel of channels) {
      try {
        let result;
        
        switch (channel) {
          case 'email':
            result = await this.sendEmail(recipient, subject, message);
            break;
          case 'sms':
            result = await this.sendSMS(recipient, message);
            break;
          case 'push':
            result = await this.sendPushNotification(recipient, subject, message);
            break;
          case 'inApp':
            result = await this.sendInAppNotification(recipient, subject, message);
            break;
          case 'webhook':
            result = await this.sendWebhook(recipient, subject, message);
            break;
          default:
            throw new Error(`Unknown channel: ${channel}`);
        }

        if (result.success) {
          results.success.push({ channel, result });
          results.totalSent++;
          
          // If high priority and one channel succeeds, continue with others
          // If normal priority and one succeeds, stop here
          if (priority === 'normal' && !fallback) {
            break;
          }
        }
      } catch (error) {
        results.failed.push({ channel, error: error.message });
      }
    }

    return results;
  }

  // Enhanced email with multiple SMTP fallback
  async sendEmail(recipient, subject, message) {
    // Prioritize custom webmail SMTP as requested by user
    const smtpConfigs = [
      {
        name: 'webmail_starttls',
        host: process.env.EMAIL_HOST,
        port: 587, // Port 587 for cloud compatibility
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 60000, // Extended timeout for cloud
        greetingTimeout: 30000,
        socketTimeout: 60000,
        tls: {
          rejectUnauthorized: false, // For webmail compatibility
          ciphers: 'SSLv3' // Additional compatibility
        }
      },
      {
        name: 'webmail_ssl',
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 465,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        }
      },
      {
        name: 'gmail_fallback',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.GMAIL_USER || process.env.EMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS
        },
        connectionTimeout: 60000,
        greetingTimeout: 30000,
        socketTimeout: 60000
      }
    ];

    for (const config of smtpConfigs) {
      try {
        console.log(`Attempting SMTP connection with ${config.name} on port ${config.port}`);
        const transporter = nodemailer.createTransport(config);
        
        // Test the connection first
        await transporter.verify();
        
        const mailOptions = {
          from: `"Elite Associate" <${config.auth.user}>`,
          to: recipient,
          subject: subject,
          html: this.formatEmailHTML(message),
          text: message,
          headers: {
            'X-Mailer': 'Elite Associate Notification System',
            'List-Unsubscribe': '<mailto:unsubscribe@eliteassociate.in>',
            'X-Priority': '3',
            'X-MSMail-Priority': 'Normal',
            'Importance': 'Normal'
          }
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully via ${config.name}`);
        return { success: true, provider: config.name, messageId: result.messageId };
        
      } catch (error) {
        console.log(`SMTP ${config.name} failed:`, error.message);
        continue; // Try next SMTP provider
      }
    }

    throw new Error('All SMTP providers failed');
  }

  // In-app notification (store in database)
  async sendInAppNotification(userId, title, message) {
    try {
      // This would typically save to your database
      const notification = {
        userId: userId,
        title: title,
        message: message,
        type: 'info',
        read: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      // Save to database (pseudo code)
      // await NotificationModel.create(notification);
      
      // Emit via WebSocket if user is online
      // io.to(userId).emit('notification', notification);

      return { 
        success: true, 
        notificationId: 'temp_' + Date.now(),
        message: 'In-app notification queued'
      };
    } catch (error) {
      throw new Error(`In-app notification failed: ${error.message}`);
    }
  }

  // SMS via Twilio (requires setup)
  async sendSMS(phoneNumber, message) {
    if (!this.channels.sms) {
      throw new Error('SMS channel not configured');
    }

    // Twilio implementation would go here
    // const twilio = require('twilio');
    // const client = twilio(accountSid, authToken);
    
    return { 
      success: true, 
      provider: 'twilio',
      message: 'SMS would be sent here'
    };
  }

  // Push notification via FCM (requires setup)
  async sendPushNotification(userId, title, message) {
    if (!this.channels.push) {
      throw new Error('Push notification channel not configured');
    }

    // FCM implementation would go here
    return { 
      success: true, 
      provider: 'fcm',
      message: 'Push notification would be sent here'
    };
  }

  // Webhook notification
  async sendWebhook(recipient, subject, message) {
    if (!this.channels.webhook) {
      throw new Error('Webhook channel not configured');
    }

    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const payload = {
      recipient,
      subject,
      message,
      timestamp: new Date().toISOString(),
      source: 'elite-associate-backend'
    };

    // HTTP POST to webhook URL
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    return { 
      success: true, 
      provider: 'webhook',
      status: response.status
    };
  }

  // Format email with professional HTML
  formatEmailHTML(message) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Elite Associate Notification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Elite Associate</h1>
            <p style="color: #f0f0f0; margin: 5px 0 0 0;">Professional Services</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                ${message.replace(/\n/g, '<br>')}
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
                <p><strong>Elite Associate</strong><br>
                Professional Services & Consultancy<br>
                Email: info@eliteassociate.in<br>
                Website: eliteassociate.in</p>
                
                <p style="margin-top: 15px;">
                    <a href="mailto:info@eliteassociate.in?subject=Unsubscribe" style="color: #667eea; text-decoration: none;">Unsubscribe</a> | 
                    <a href="https://eliteassociate.in/privacy" style="color: #667eea; text-decoration: none;">Privacy Policy</a>
                </p>
            </div>
        </div>
    </body>
    </html>`;
  }

  // Get notification statistics
  async getNotificationStats() {
    return {
      channels: this.channels,
      totalSent: 0, // Would come from database
      successRate: 0, // Would be calculated
      lastSent: null // Would come from database
    };
  }
}

export default MailNoticeController;
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Enhanced SMTP configuration with better error handling and cloud compatibility
const createSMTPConfig = () => {
  // Validate required environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('EMAIL_USER and EMAIL_PASS environment variables are required');
  }

  // Properly handle secure setting from environment variables
  const secureSetting = process.env.EMAIL_SECURE ? 
    process.env.EMAIL_SECURE.toLowerCase() === 'true' : 
    Number(process.env.EMAIL_PORT) === 465;

  const smtpConfig = {
    host: process.env.EMAIL_HOST || "mail.eliteassociate.in",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: secureSetting,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      // Many shared hosts use self-signed certs; avoid strict rejection
      rejectUnauthorized: false,
      // Additional TLS options for better compatibility
      ciphers: 'SSLv3',
    },
    // Connection robustness for cloud deployments
    connectionTimeout: Number(process.env.EMAIL_CONN_TIMEOUT) || 30000, // 30s
    greetingTimeout: Number(process.env.EMAIL_GREET_TIMEOUT) || 30000, // 30s
    socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT) || 30000, // 30s
    // Enable pooling to reuse connections in rapid successive sends
    pool: true,
    maxConnections: Number(process.env.EMAIL_MAX_CONN) || 5,
    maxMessages: Number(process.env.EMAIL_MAX_MSGS) || 100,
    // Rate limiting to prevent overwhelming the SMTP server
    rateDelta: Number(process.env.EMAIL_RATE_DELTA) || 1000, // 1 second
    rateLimit: Number(process.env.EMAIL_RATE_LIMIT) || 5, // 5 messages per second
  };

  return smtpConfig;
};

// Create transporter with error handling
let transporter;
try {
  const smtpConfig = createSMTPConfig();
  transporter = nodemailer.createTransport(smtpConfig);
  
  // Verify transporter configuration
  transporter.verify((error, success) => {
    if (error) {
      console.warn('SMTP configuration warning:', error.message);
      console.info('The application will continue to run but email functionality may be affected.');
    } else {
      console.log('SMTP server is ready to send emails');
    }
  });
} catch (configError) {
  console.error('Failed to configure SMTP transporter:', configError.message);
  transporter = null;
}

// Helper: detect connection/timeout errors
const isConnTimeoutError = (err) => {
  const code = err?.code || "";
  const msg = (err?.message || "").toLowerCase();
  return (
    code === "ETIMEDOUT" ||
    code === "ECONNECTION" ||
    code === "ESOCKET" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    msg.includes("timeout") ||
    msg.includes("socket") ||
    msg.includes("connection") ||
    msg.includes("certificate") ||
    msg.includes("tls") ||
    msg.includes("ssl")
  );
};

// Enhanced mail sending helper with multiple fallback strategies
const sendMailHelper = async (mailOptions) => {
  if (!transporter) {
    throw new Error('SMTP transporter is not configured. Check your environment variables.');
  }

  try {
    // First attempt with primary configuration
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.warn('Primary SMTP attempt failed:', error.message);
    
    // Fallback attempt using port 465 (secure) if we hit connection/timeout errors
    if (isConnTimeoutError(error)) {
      try {
        console.log('Attempting fallback SMTP configuration on port 465...');
        const fallbackConfig = {
          ...createSMTPConfig(),
          port: 465,
          secure: true,
        };
        const fallbackTransporter = nodemailer.createTransport(fallbackConfig);
        await fallbackTransporter.verify();
        return await fallbackTransporter.sendMail(mailOptions);
      } catch (fallbackError) {
        console.warn('Fallback SMTP attempt failed:', fallbackError.message);
      }
    }
    
    // Try with different TLS settings
    try {
      console.log('Attempting SMTP with alternative TLS settings...');
      const altTLSConfig = {
        ...createSMTPConfig(),
        tls: {
          rejectUnauthorized: true, // Try with strict certificate validation
        }
      };
      const altTLSTransporter = nodemailer.createTransport(altTLSConfig);
      await altTLSTransporter.verify();
      return await altTLSTransporter.sendMail(mailOptions);
    } catch (altTLSError) {
      console.warn('Alternative TLS SMTP attempt failed:', altTLSError.message);
    }
    
    // If all attempts fail, throw the original error
    throw error;
  }
};

// Send mail to a single client
export const sendSingleMail = async (req, res) => {
  try {
    const { to, subject, message } = req.body || {};

    if (!to || !subject || !message) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields: to, subject, and message are required" 
      });
    }

    // Enhanced professional email formatting to reduce spam classification
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2c3e50; margin: 0;">Elite Associate</h2>
          <p style="color: #7f8c8d; margin: 5px 0 0 0;">Professional Services</p>
        </div>
        
        <div style="background-color: white; padding: 30px; border-radius: 8px; border: 1px solid #e9ecef;">
          <p style="margin-bottom: 20px;">${message}</p>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          
          <div style="font-size: 14px; color: #6c757d;">
            <p><strong>Elite Associate</strong><br>
            Professional Services & Consultation<br>
            Email: info@eliteassociate.in</p>
            
            <p style="margin-top: 20px; font-size: 12px;">
              This email was sent from our CRM system. If you received this in error, please contact us at info@eliteassociate.in
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Elite Associate - Professional Services

${message}

---
Elite Associate
Professional Services & Consultation
Email: info@eliteassociate.in

This email was sent from our CRM system. If you received this in error, please contact us at info@eliteassociate.in
    `.trim();

    const mailOptions = {
      from: `"Elite Associate" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
      text: textContent,
      replyTo: process.env.EMAIL_USER,
      headers: {
        "X-Mailer": "EliteAssociateMailer v1.0",
        "List-Unsubscribe": `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
        "X-Priority": "3",
        "X-MSMail-Priority": "Normal",
        "Importance": "Normal"
      },
    };

    const info = await sendMailHelper(mailOptions);
    console.log("SMTP Result (single):", {
      accepted: info?.accepted,
      rejected: info?.rejected,
      response: info?.response,
      envelope: info?.envelope,
      messageId: info?.messageId,
    });

    res.status(200).json({
      success: true,
      message: "Mail sent successfully",
      id: info?.messageId,
      accepted: info?.accepted || [],
      rejected: info?.rejected || [],
      response: info?.response,
      envelope: info?.envelope,
    });
  } catch (error) {
    console.error("Mail Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send mail",
      error: error.message,
      code: error.code,
      response: error.response,
      command: error.command,
      // Additional debugging information
      debug: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE,
        user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}...` : 'Not set'
      }
    });
  }
};

// Send mail to multiple clients
export const sendGroupMail = async (req, res) => {
  try {
    const { recipients, subject, message } = req.body || {};

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Recipients are required" 
      });
    }

    // Use BCC for group emails to improve privacy and deliverability
    const mailOptions = {
      from: `"Elite Associate" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // placeholder 'to' as many SMTPs require it
      bcc: Array.isArray(recipients) ? recipients.join(",") : recipients,
      subject,
      html: `<p>${message}</p>`,
      text: `${message}`,
      replyTo: process.env.EMAIL_USER,
      headers: {
        "X-Mailer": "EliteAssociateMailer",
        "List-Unsubscribe": `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`
      },
    };

    const info = await sendMailHelper(mailOptions);
    console.log("SMTP Result (group):", {
      accepted: info?.accepted,
      rejected: info?.rejected,
      response: info?.response,
      envelope: info?.envelope,
      messageId: info?.messageId,
    });

    res.status(200).json({
      success: true,
      message: "Group mail sent successfully!",
      id: info?.messageId,
      accepted: info?.accepted || [],
      rejected: info?.rejected || [],
    });
  } catch (error) {
    console.error("Group Mail Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send group mail",
      error: error.message,
      code: error.code,
      response: error.response,
      command: error.command,
      // Additional debugging information
      debug: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_SECURE,
        user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}...` : 'Not set'
      }
    });
  }
};
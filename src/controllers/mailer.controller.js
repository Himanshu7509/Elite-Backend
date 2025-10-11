import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Build SMTP config from env with sensible defaults and timeouts
const smtpConfig = {
  host: process.env.EMAIL_HOST || "mail.eliteassociate.in",
  port: Number(process.env.EMAIL_PORT) || 587,
  secure:
    (process.env.EMAIL_SECURE || "").toLowerCase() === "true" ||
    Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    // Many shared hosts use self-signed certs; avoid strict rejection
    rejectUnauthorized: false,
  },
  // Connection robustness
  connectionTimeout: Number(process.env.EMAIL_CONN_TIMEOUT) || 10000, // 10s
  greetingTimeout: Number(process.env.EMAIL_GREET_TIMEOUT) || 10000, // 10s
  socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT) || 10000, // 10s
  // Enable pooling to reuse connections in rapid successive sends
  pool: true,
  maxConnections: Number(process.env.EMAIL_MAX_CONN) || 1,
  maxMessages: Number(process.env.EMAIL_MAX_MSGS) || Infinity,
};

// Define primary transporter
const transporter = nodemailer.createTransport(smtpConfig);

// Helper: detect connection/timeout errors
const isConnTimeoutError = (err) => {
  const code = err?.code || "";
  const msg = (err?.message || "").toLowerCase();
  return (
    code === "ETIMEDOUT" ||
    code === "ECONNECTION" ||
    code === "ESOCKET" ||
    msg.includes("timeout") ||
    msg.includes("socket") ||
    msg.includes("connection")
  );
};

// Common mail sending helper with retry/fallback to implicit TLS (465)
const sendMailHelper = async (mailOptions) => {
  try {
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    // Fallback attempt using port 465 (secure) if we hit connection/timeout errors
    if (isConnTimeoutError(error)) {
      const fallbackConfig = {
        ...smtpConfig,
        port: 465,
        secure: true,
      };
      const fallbackTransporter = nodemailer.createTransport(fallbackConfig);
      return await fallbackTransporter.sendMail(mailOptions);
    }
    throw error;
  }
};

// Send mail to a single client
export const sendSingleMail = async (req, res) => {
  try {
    const { to, subject, message } = req.body || {};

    if (!to || !subject || !message) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Enhanced professional email formatting to reduce spam classification
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
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
      accepted: info?.accepted,
      rejected: info?.rejected,
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
    });
  }
};

// Send mail to multiple clients
export const sendGroupMail = async (req, res) => {
  try {
    const { recipients, subject, message } = req.body || {};

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ message: "Recipients are required" });
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

    res
      .status(200)
      .json({
        success: true,
        message: "Group mail sent successfully!",
        id: info?.messageId,
        accepted: info?.accepted,
        rejected: info?.rejected,
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
    });
  }
};

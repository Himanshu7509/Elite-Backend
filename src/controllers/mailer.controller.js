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
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const mailOptions = {
      from: `"Elite Associate" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `<p>${message}</p>`,
    };

    const info = await sendMailHelper(mailOptions);

    res.status(200).json({
      success: true,
      message: "Mail sent successfully",
      id: info?.messageId,
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
    const { recipients, subject, message } = req.body;

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
    };

    const info = await sendMailHelper(mailOptions);

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

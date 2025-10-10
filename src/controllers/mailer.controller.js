import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// ✅ Define transporter ONCE (globally)
const transporter = nodemailer.createTransport({
  host: "radiant.herosite.pro",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// ✅ Common mail sending function (optional helper)
const sendMailHelper = async (mailOptions) => {
  return transporter.sendMail(mailOptions);
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

    await sendMailHelper(mailOptions);

    res.status(200).json({ success: true, message: "Mail sent successfully" });
  } catch (error) {
    console.error("Mail Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send mail",
      error: error.message,
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

    const mailOptions = {
      from: `"Elite Associate" <${process.env.EMAIL_USER}>`,
      to: recipients.join(","), // join array into comma-separated string
      subject,
      html: `<p>${message}</p>`,
    };

    await sendMailHelper(mailOptions);

    res
      .status(200)
      .json({ success: true, message: "Group mail sent successfully!" });
  } catch (error) {
    console.error("Group Mail Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send group mail",
      error: error.message,
    });
  }
};

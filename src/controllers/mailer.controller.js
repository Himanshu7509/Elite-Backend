import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// 🔹 Create reusable transporter (Gmail / Zoho / Outlook)
const transporter = nodemailer.createTransport({
  service: "gmail", // or 'zoho', 'outlook'
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


export const sendSingleMail = async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const mailOptions = {
      from: `"Elite CRM" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: `<p>${message}</p>`,
    };

    await transporter.sendMail(mailOptions);
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


export const sendGroupMail = async (req, res) => {
  try {
    const { recipients, subject, message } = req.body;

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ message: "Recipients are required" });
    }

    const mailOptions = {
      from: `"Elite CRM" <${process.env.EMAIL_USER}>`,
      to: recipients.join(","), // join array into a comma-separated string
      subject,
      html: `<p>${message}</p>`,
    };

    await transporter.sendMail(mailOptions);
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

import nodemailer from "nodemailer";
import Form from "../models/form.model.js";

// ✅ Setup mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Send mail to a single lead
export const sendSingleMail = async (req, res) => {
  try {
    const { leadId, subject, message } = req.body;

    const lead = await Form.findById(leadId);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: lead.email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h3>Hello ${lead.fullName || "there"},</h3>
          <p>${message}</p>
          <br />
          <p>Regards,<br>Elite Associate Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: `Mail sent to ${lead.email}` });
  } catch (error) {
    console.error("Error sending mail:", error);
    res.status(500).json({ success: false, message: "Failed to send mail", error: error.message });
  }
};

// ✅ Send mail to multiple leads (group)
export const sendGroupMail = async (req, res) => {
  try {
    const { leadIds, subject, message } = req.body;

    const leads = await Form.find({ _id: { $in: leadIds } });
    const emails = leads.map((lead) => lead.email);

    if (emails.length === 0) {
      return res.status(404).json({ success: false, message: "No valid leads found" });
    }

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      bcc: emails, // ✅ Use BCC for group privacy
      subject,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <p>${message}</p>
          <br />
          <p>Regards,<br>Elite Associate Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: `Group mail sent to ${emails.length} leads`,
      emails,
    });
  } catch (error) {
    console.error("Error sending group mail:", error);
    res.status(500).json({ success: false, message: "Failed to send group mail", error: error.message });
  }
};

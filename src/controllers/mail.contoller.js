import { Resend } from "resend";
import Form from "../models/form.model.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Send mail to a single lead
export const sendSingleMail = async (req, res) => {
  try {
    const { leadId, subject, message } = req.body;
    // Get sender information from authenticated user
    const sender = req.user ? `${req.user.email} (${req.user.role})` : "Unknown sender";

    const lead = await Form.findById(leadId);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    // Prepare attachments if any
    const attachments = [];
    if (req.files) {
      for (const file of req.files) {
        attachments.push({
          filename: file.originalname,
          content: file.buffer,
        });
      }
    }

    await resend.emails.send({
      from: "Elite Associate <noreply@mail.eliteassociate.in>",
      to: lead.email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h3>Hello ${lead.fullName || "there"},</h3>
          <p>${message}</p>
          <br />
          <p>Regards,<br>Elite Associate Team</p>
          <hr />
          <small>Sent by: ${sender}</small>
        </div>
      `,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    res.status(200).json({ success: true, message: `Mail sent to ${lead.email}`, sender });
  } catch (error) {
    console.error("Error sending mail:", error);
    res.status(500).json({ success: false, message: "Failed to send mail", error: error.message });
  }
};

// ✅ Send mail to multiple leads (group)
export const sendGroupMail = async (req, res) => {
  try {
    const { leadIds, subject, message } = req.body;
    // Get sender information from authenticated user
    const sender = req.user ? `${req.user.email} (${req.user.role})` : "Unknown sender";

    const leads = await Form.find({ _id: { $in: leadIds } });
    const emails = leads.map((lead) => lead.email);

    if (emails.length === 0) {
      return res.status(404).json({ success: false, message: "No valid leads found" });
    }

    // Prepare attachments if any
    const attachments = [];
    if (req.files) {
      for (const file of req.files) {
        attachments.push({
          filename: file.originalname,
          content: file.buffer,
        });
      }
    }

    await resend.emails.send({
      from: "Elite Associate <noreply@mail.eliteassociate.in>",
      to: ["me@mail.eliteassociate.in"],
      bcc: emails, 
      subject,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <p>${message}</p>
          <br />
          <p>Regards,<br>Elite Associate Team</p>
          <hr />
          <small>Sent by: ${sender}</small>
        </div>
      `,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    res.status(200).json({
      success: true,
      message: `Group mail sent to ${emails.length} leads`,
      emails,
      sender,
    });
  } catch (error) {
    console.error("Error sending group mail:", error);
    res.status(500).json({ success: false, message: "Failed to send group mail", error: error.message });
  }
};

// ✅ Configure multer for file upload
export const uploadFiles = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs only
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed'));
    }
  }
});
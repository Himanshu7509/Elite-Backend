import { Resend } from "resend";
import Form from "../models/form.model.js";

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Send mail to a single lead
export const sendSingleMail = async (req, res) => {
  try {
    const { leadId, subject, message } = req.body;

    const lead = await Form.findById(leadId);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

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
        </div>
      `,
    });

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
        </div>
      `,
    });

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

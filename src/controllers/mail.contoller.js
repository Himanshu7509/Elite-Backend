import { Resend } from "resend";
import Form from "../models/form.model.js";
import MailTracking from "../models/mailTracking.model.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to get the public URL for the signature image
const getSignatureImageUrl = () => {
  // In production, use the actual domain
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
  return `${baseUrl}/assets/sign.gif`;
};

// Helper function to extract message ID from Resend response
const extractMessageId = (response) => {
  // Handle different possible response structures
  if (response && response.id) {
    return response.id;
  }
  if (response && response.data && response.data.id) {
    return response.data.id;
  }
  // Generate fallback ID if none found
  return `fallback-${uuidv4()}`;
};

// Helper function to ensure leadIds is always an array
const normalizeLeadIds = (leadIds) => {
  if (!leadIds) return [];
  if (Array.isArray(leadIds)) return leadIds;
  if (typeof leadIds === "string") {
    // Check if it"s a JSON string
    if (leadIds.startsWith("[") && leadIds.endsWith("]")) {
      try {
        const parsed = JSON.parse(leadIds);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        return [leadIds];
      }
    }
    return [leadIds];
  }
  return [];
};

// ✅ Send mail to a single lead
export const sendSingleMail = async (req, res) => {
  try {
    const { leadId, subject, message } = req.body;
    // Get sender information from authenticated user
    const sender = req.user ? `${req.user.email} (${req.user.role})` : "Elite Associate";
    const senderEmail = req.user ? req.user.email : "noreply@mail.eliteassociate.in";
    const senderRole = req.user ? req.user.role : "system";

    const lead = await Form.findById(leadId);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    // Prepare attachments if any
    const attachments = [];
    const attachmentInfo = [];
    if (req.files) {
      for (const file of req.files) {
        attachments.push({
          filename: file.originalname,
          content: file.buffer,
        });
        attachmentInfo.push({
          filename: file.originalname,
          size: file.size
        });
      }
    }

    // Get signature image URL
    const signatureImageUrl = getSignatureImageUrl();

    // Send email with enhanced business template
    const emailResponse = await resend.emails.send({
      from: "Elite Associate <noreply@mail.eliteassociate.in>",
      to: lead.email,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 30px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">Elite Associate</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; text-align: center; font-size: 16px;">Business Solutions & Services</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">Hello ${lead.fullName || "Valued Customer"},</h2>
                      
                      <div style="color: #555; line-height: 1.6; font-size: 16px;">
                        ${message.split("\n").map(paragraph => `<p style="margin: 0 0 15px 0;">${paragraph}</p>`).join("")}
                      </div>
                      
                      <div style="margin: 30px 0 20px 0; text-align: left;">
                        <img src="${signatureImageUrl}" alt="Director Signature" style="max-width: 200px; height: auto; display: block;" />
                      </div>
                      
                      <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                        <p style="margin: 0; color: #333; font-weight: bold;">Message Details:</p>
                        <p style="margin: 5px 0 0 0; color: #666;">Subject: <strong>${subject}</strong></p>
                        <p style="margin: 5px 0 0 0; color: #666;">From: Elite Associate Team</p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                      <div style="text-align: center; color: #666; font-size: 14px;">
                        <p style="margin: 0 0 10px 0;">
                          <strong>Sent by:</strong> ${sender}
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="margin: 0;">
                          © ${new Date().getFullYear()} Elite Associate. All rights reserved.
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
                          This email was sent to ${lead.email} regarding our business services.
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    // Extract or generate messageId
    const messageId = extractMessageId(emailResponse);

    // Save tracking information
    try {
      if (MailTracking) {
        await MailTracking.create({
          messageId: messageId,
          senderEmail: senderEmail,
          senderRole: senderRole,
          recipients: [lead.email],
          recipientType: "single",
          subject: subject,
          attachments: attachmentInfo,
          leadIds: [leadId]
        });
      }
    } catch (trackingError) {
      console.error("Failed to save mail tracking information:", trackingError);
    }

    res.status(200).json({ 
      success: true, 
      message: `Mail sent to ${lead.email}`, 
      sender,
      messageId: messageId
    });
  } catch (error) {
    console.error("Error sending mail:", error);
    res.status(500).json({ success: false, message: "Failed to send mail", error: error.message });
  }
};

// ✅ Send mail to multiple leads (group)
// Add this import at the top of your controller file
import axios from 'axios';

// Modify your sendGroupMail function to include URL attachment handling
export const sendGroupMail = async (req, res) => {
  try {
    const { leadIds, subject, message } = req.body;
    
    // Normalize leadIds to ensure it's always an array
    const leadIdsArray = normalizeLeadIds(leadIds);
    
    // Get sender information from authenticated user
    const sender = req.user ? `${req.user.email} (${req.user.role})` : "Elite Associate";
    const senderEmail = req.user ? req.user.email : "noreply@mail.eliteassociate.in";
    const senderRole = req.user ? req.user.role : "system";

    // Fetch all leads
    const leads = await Form.find({ _id: { $in: leadIdsArray } });
    const emails = leads.map((lead) => lead.email);

    if (emails.length === 0) {
      return res.status(404).json({ success: false, message: "No valid leads found" });
    }

    // Prepare attachments - handle both uploaded files and URL-based attachments
    const attachments = [];
    const attachmentInfo = [];
    
    // Handle uploaded files (existing code)
    if (req.files) {
      for (const file of req.files) {
        attachments.push({
          filename: file.originalname,
          content: file.buffer,
        });
        attachmentInfo.push({
          filename: file.originalname,
          size: file.size
        });
      }
    }
    
    // NEW: Handle URL-based attachments
    const attachmentUrls = Array.isArray(req.body.attachmentUrls) ? req.body.attachmentUrls : 
                          (req.body.attachmentUrls ? [req.body.attachmentUrls] : []);
    const attachmentNames = Array.isArray(req.body.attachmentNames) ? req.body.attachmentNames : 
                            (req.body.attachmentNames ? [req.body.attachmentNames] : []);
    
    // Download files from URLs if provided
    if (attachmentUrls.length > 0) {
      for (let i = 0; i < attachmentUrls.length; i++) {
        try {
          const url = attachmentUrls[i];
          const name = attachmentNames[i] || `attachment-${i + 1}`;
          
          // Download the file
          const response = await axios.get(url, { 
            responseType: 'arraybuffer',
            timeout: 10000 // 10 second timeout
          });
          
          // Create attachment object
          attachments.push({
            filename: name,
            content: response.data,
          });
          
          // Add to attachment info
          attachmentInfo.push({
            filename: name,
            size: response.data.length
          });
        } catch (downloadError) {
          console.error(`Error downloading file from ${attachmentUrls[i]}:`, downloadError);
          // Continue with other attachments even if one fails
        }
      }
    }

    // Get signature image URL
    const signatureImageUrl = getSignatureImageUrl();

    // Send email with enhanced business template using BCC for privacy
    const emailResponse = await resend.emails.send({
      from: "Elite Associate <noreply@mail.eliteassociate.in>",
      to: ["me@mail.eliteassociate.in"], // Primary recipient (sender)
      bcc: emails, // Blind carbon copy to all leads (hides email addresses from each other)
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 30px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
                      <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">Elite Associate</h1>
                      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; text-align: center; font-size: 16px;">Business Solutions & Services</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">Dear Valued Customer,</h2>
                      
                      <div style="color: #555; line-height: 1.6; font-size: 16px;">
                        ${message.split("\n").map(paragraph => `<p style="margin: 0 0 15px 0;">${paragraph}</p>`).join("")}
                      </div>
                    
                      
                      <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                        <p style="margin: 0; color: #333; font-weight: bold;">Message Details:</p>
                        <p style="margin: 5px 0 0 0; color: #666;">Subject: <strong>${subject}</strong></p>
                        <p style="margin: 5px 0 0 0; color: #666;">From: Elite Associate Team</p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
                      <div style="text-align: center; color: #666; font-size: 14px;">
                        <p style="margin: 0 0 15px 0; font-style: italic; color: #555;">
                          Best regards,<br>
                          <strong>Director</strong>
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="margin: 0;">
                          © ${new Date().getFullYear()} Elite Associate. All rights reserved.
                        </p>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
                          This is a group message sent to multiple recipients.
                        </p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    // Extract or generate messageId
    const messageId = extractMessageId(emailResponse);

    // Save tracking information
    try {
      if (MailTracking) {
        await MailTracking.create({
          messageId: messageId,
          senderEmail: senderEmail,
          senderRole: senderRole,
          recipients: emails,
          recipientType: "group",
          subject: subject,
          attachments: attachmentInfo,
          leadIds: leadIdsArray
        });
      }
    } catch (trackingError) {
      console.error("Failed to save group mail tracking information:", trackingError);
    }

    res.status(200).json({
      success: true,
      message: `Group mail sent to ${emails.length} leads`,
      emails,
      sender,
      messageId: messageId
    });
  } catch (error) {
    console.error("Error sending group mail:", error);
    res.status(500).json({ success: false, message: "Failed to send group mail", error: error.message });
  }
};

// ✅ Get all sent emails with sender information
export const getSentMails = async (req, res) => {
  try {
    const { page = 1, limit = 10, senderEmail, recipientType } = req.query;
    
    // Build filter object
    let filter = {};
    if (senderEmail) filter.senderEmail = senderEmail;
    if (recipientType) filter.recipientType = recipientType;
    
    // Check if MailTracking model is available
    if (!MailTracking) {
      return res.status(500).json({ success: false, message: "Mail tracking not available" });
    }
    
    // Get paginated results
    const mails = await MailTracking.find(filter)
      .sort({ sentAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("leadIds", "fullName email");
      
    // Get total count
    const total = await MailTracking.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      mails,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalMails: total
    });
  } catch (error) {
    console.error("Error fetching sent mails:", error);
    res.status(500).json({ success: false, message: "Failed to fetch sent mails", error: error.message });
  }
};

// ✅ Get specific sent email by ID
export const getSentMailById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if MailTracking model is available
    if (!MailTracking) {
      return res.status(500).json({ success: false, message: "Mail tracking not available" });
    }
    
    const mail = await MailTracking.findById(id).populate("leadIds", "fullName email");
    
    if (!mail) {
      return res.status(404).json({ success: false, message: "Mail tracking record not found" });
    }
    
    res.status(200).json({ success: true, mail });
  } catch (error) {
    console.error("Error fetching sent mail:", error);
    res.status(500).json({ success: false, message: "Failed to fetch sent mail", error: error.message });
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
    if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only image files and PDFs are allowed"));
    }
  }
});
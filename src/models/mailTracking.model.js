import mongoose from "mongoose";

const mailTrackingSchema = new mongoose.Schema({
  messageId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  senderEmail: {
    type: String,
    required: true,
    trim: true
  },
  senderRole: {
    type: String,
    required: true,
    trim: true
  },
  recipients: [{
    type: String,
    required: true,
    trim: true
  }],
  recipientType: {
    type: String,
    enum: ['single', 'group'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  attachments: [{
    filename: String,
    size: Number
  }],
  leadIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form'
  }]
}, { timestamps: true });

// Add indexes for better query performance
mailTrackingSchema.index({ senderEmail: 1 });
mailTrackingSchema.index({ recipientType: 1 });
mailTrackingSchema.index({ sentAt: -1 });

export default mongoose.model("MailTracking", mailTrackingSchema);
import mongoose from 'mongoose';

const internAppliedDataSchema = new mongoose.Schema({
  // Basic applicant details
  fullName: {
    type: String,
    required: false,
    trim: true
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  phoneNo1: {
    type: String,
    required: false,
    trim: true
  },
  phoneNo2: {
    type: String,
    trim: true
  },
  postAppliedFor: {
    type: String,
    required: false,
    trim: true
  },
  
  // Company/Product information
  productCompany: { type: String, required: false },
  
  // Resume and photo
  resumeUrl: {
    type: String,
    required: false
  },
  photoUrl: {
    type: String,
    required: false
  },
  
  // CRM system fields
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
  assignedByName: { type: String, default: null }, // Name of the person who assigned the lead
  status: {
    type: String,
    enum: ["unread", "read", "interview_scheduled", "interview_completed", "selected", "rejected"],
    default: "unread",
  },
  
  // Interview tracking fields
  callStatus: {
    type: String,
    enum: ["not_called", "called", "follow_up_required", "not_reachable"],
    default: "not_called"
  },
  interviewRoundStatus: {
    type: String,
    enum: ["not_scheduled", "scheduled", "completed", "rescheduled", "cancelled"],
    default: "not_scheduled"
  },
  aptitudeRoundStatus: {
    type: String,
    enum: ["not_scheduled", "scheduled", "completed", "rescheduled", "cancelled", "passed", "failed"],
    default: "not_scheduled"
  },
  hrRoundStatus: {
    type: String,
    enum: ["not_scheduled", "scheduled", "completed", "rescheduled", "cancelled", "passed", "failed"],
    default: "not_scheduled"
  },
  admissionLetter: {
    type: String,
    enum: ["not_issued", "issued", "received"],
    default: "not_issued"
  },
  
  // Fees and Payment
  feesStatus: {
    type: String,
    enum: ["not_paid", "partially_paid", "fully_paid"],
    default: "not_paid"
  },
  paymentMethod: {
    type: String,
    enum: ["UPI", "cash", "bank_transfer", "cheque", "other"],
    default: "other"
  },
  feesInstallmentStructure: {
    type: String,
    enum: ["one_time", "two_installments", "three_installments", "four_installments", "EMI", "Loan", "other"],
    default: "one_time"
  },
  
  // Tracking fields
  createdBy: { 
    type: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
      email: { type: String },
      role: { type: String },
      name: { type: String }
    },
    default: null 
  },
  updatedBy: { 
    type: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
      email: { type: String },
      role: { type: String },
      name: { type: String }
    },
    default: null 
  },
  source: { 
    type: String, 
    enum: ["website", "admin", "manager", "sales", "marketing", "counsellor", "telecaller", "hr", "other"],
    default: "other" 
  },
  
  feedback: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  
  // Date fields
  date: { type: Date, default: Date.now }, // Application submission date
  
  // Remarks system
  remarks: [{
    sequenceNumber: Number,
    message: String,
    reminderDate: Date,
    status: String,
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    isActive: { type: Boolean, default: true }
  }]
}, {
  timestamps: true
});

export default mongoose.model('InternAppliedData', internAppliedDataSchema);
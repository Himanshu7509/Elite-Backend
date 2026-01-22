import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
  // Basic student details
  studentName: {
    type: String,
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  studentPhone: {
    type: String,
    required: false
  },
  courseName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: false
  },
  productCompany: {
    type: String,
    required: true,
    enum: ['JIFSA', 'Elite-BIM', 'Elite-BIFS', 'EEE-Technologies', 'Elite-Jobs', 'Elite-Cards']
  },
  
  // CRM system fields
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
  assignedByName: { type: String, default: null }, // Name of the person who assigned the enrollment
  
  // Status fields
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'confirmed', 'cancelled']
  },
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
  
  // Additional info
  age: {
    type: Number,
    required: false
  },
  gender: {
    type: String,
    required: false
  },
  location: {
    type: String,
    required: false
  },
  qualification: {
    type: String,
    required: false
  },
  
  // Education qualifications
  education: {
    type: {
      tenth: { type: Boolean, default: false },
      twelfth: { type: Boolean, default: false },
      undergraduate: { type: Boolean, default: false },
      postgraduate: { type: Boolean, default: false },
      phd: { type: Boolean, default: false }
    },
    _id: false
  },
  
  // Remarks system
  remarks: [{
    sequenceNumber: Number,
    message: String,
    reminderDate: Date,
    status: String,
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    isActive: { type: Boolean, default: true }
  }],
  
  // Education & Experience
  experience: { type: String },
  specialisation: { type: String },
  highestDegree: { type: String },
  collegeOrInstituteName: { type: String },
  schoolName: { type: String },
  
  // Date fields
  enrolledAt: {
    type: Date,
    default: Date.now
  },
  date: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
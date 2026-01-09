import mongoose from "mongoose";

const formSchema = new mongoose.Schema(
  {
    // Basic applicant details
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNo: { type: String, required: true },
    alternatePhoneNo: { type: String }, // ✅ New field
    age: { type: Number }, // ✅ New field
    dob: { type: Date }, // ✅ New field (Date of Birth)
    address: { type: String }, // ✅ New field

    // Additional info
    message: { type: String },
    fatherName: { type: String },
    contactNo: { type: String },

    // Education & experience details
    experience: { type: String },
    specialisation: { type: String },
    highestDegree: { type: String }, // ✅ New field
    collegeOrInstituteName: { type: String }, // ✅ New field
    schoolName: { type: String }, // ✅ New field
    
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
    

    // Company/Product information
    productCompany: { type: String, required: true },

    // CRM system fields
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    assignedByName: { type: String, default: null }, // Name of the person who assigned the lead
    status: {
      type: String,
      enum: ["unread", "read", "interested", "not_interested"],
      default: "unread",
    },
    
    // New CRM fields
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
      enum: ["website", "admin", "manager", "sales", "marketing", "counsellor", "telecaller", "other"],
      default: "other" 
    },

    feedback: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },

    // Date fields
    date: { type: Date, default: Date.now }, // ✅ New field (Form submission date)
    
    // Resume field
    resume: { type: String }, // URL to resume file in S3
  },
  { timestamps: true }
);

const Form = mongoose.model("Form", formSchema);

export default Form;
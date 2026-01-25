import mongoose from "mongoose";

const seoSchema = new mongoose.Schema({
  productCompany: {
    type: String,
    required: true,
    enum: ['JIFSA', 'Elite-BIM', 'Elite-BIFS', 'EEE-Technologies', 'Elite-Jobs', 'Elite-Cards', 'Elite-Associate', 'Elite-Properties', 'Elite-Paisa', 'Elite-Management']
  },
  
  submissionEntity: {
    type: String,
    required: true,
    enum: [
      'Bookmarking Submission',
      'Blog Submission', 
      'Social sharing submission',
      'Ping submission',
      'Mind Map submission',
      'Profile submission'
    ]
  },
  
  count: {
    type: Number,
    required: false
  },
  
  date: {
    type: Date,
    required: false
  },
  
  links: [{
    type: String,
    required: false
  }],
  
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
    enum: ["website", "admin", "manager", "sales", "marketing", "counsellor", "telecaller", "hr", "developer", "analyst", "other"],
    default: "other" 
  }

}, { 
  timestamps: true // This adds createdAt and updatedAt automatically
});

const Seo = mongoose.model("Seo", seoSchema);

export default Seo;
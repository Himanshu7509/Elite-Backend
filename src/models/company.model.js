import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  company: {
    name: {
      type: String,
      required: true
    },
    description: String,
    website: String,
    logo: String
  },
  location: {
    type: [String],
    required: true
  },
  jobType: {
    type: String,
    required: false
  },
  interviewType: {
    type: String,
    required: false
  },
  workType: {
    type: String,
    required: false
  },
  minEducation: {
    type: String,
    required: false
  },
  salary: {
    min: String,
    max: String,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  requirements: [String],
  responsibilities: [String],
  skills: [String],
  experienceLevel: {
    type: String,
    required: false
  },
  noticePeriod: {
    type: String,
    required: false
  },
  applicationDeadline: {
    type: Date,
    required: false
  },
  category: {
    type: String,
    required: true
  },
  numberOfOpenings: {
    type: Number,
    required: false
  },
  yearOfPassing: {
    type: String,
    required: false
  },
  shift: {
    type: String,
    required: false
  },
  walkInDate: {
    type: Date,
    required: false
  },
  walkInTime: {
    type: String,
    required: false
  },
  directLink: {
    type: String,
    required: false
  }
}, { timestamps: true });

export default mongoose.model('Company', companySchema);
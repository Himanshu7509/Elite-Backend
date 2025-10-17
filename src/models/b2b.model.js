import mongoose from "mongoose";

const b2bSchema = new mongoose.Schema({
  instituteName: {
    type: String,
    required: true,
    trim: true,
  },
  clientName: {
    type: String,
    required: true,
    trim: true,
  },
  phoneNo: {
    type: String,
    required: true,
    trim: true,
  },
  contactNo: {
    type: String,
    trim: true,
  },
  instituteEmail: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  visitingDate: {
    type: Date,
    required: true,
  },
  visitingTime: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  creatorRole: {
    type: String,
    required: true,
  }
}, { timestamps: true });

const B2B = mongoose.model("B2B", b2bSchema);

export default B2B;
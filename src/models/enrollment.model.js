import mongoose from "mongoose";

const enrollmentSchema = new mongoose.Schema({
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
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'confirmed', 'cancelled']
  },
  enrolledAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

export default Enrollment;
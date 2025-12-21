import mongoose from "mongoose";

const socialMediaSchema = new mongoose.Schema({
  productCompany: {
    type: String,
    required: true,
    enum: ['JIFSA', 'Elite-BIM', 'Elite-BIFS', 'EEE-Technologies', 'Elite-Jobs', 'Elite-Cards']
  },
  caption: {
    type: String,
    default: ''
  },
  platforms: {
    type: [String],
    required: true,
    enum: ['facebook', 'instagram', 'whatsapp', 'linkedin', 'X']
  },
  uploadType: {
    type: String,
    required: true,
    enum: ['post', 'reel']
  },
  date: {
    type: Date,
    required: true
  },
  sourceUrl: {
    type: String,
    default: null
  },
  imageUrl: {
    type: String,
    default: null
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: false // Made this optional
  },
  uploadedByName: {
    type: String,
    required: true
  },
  uploadedByEmail: {
    type: String,
    required: true
  }
}, { 
  timestamps: true 
});

const SocialMedia = mongoose.model("SocialMedia", socialMediaSchema);

export default SocialMedia;
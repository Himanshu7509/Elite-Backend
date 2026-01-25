import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  productCompany: {
    type: String,
    required: true,
    enum: ['JIFSA', 'Elite-BIM', 'Elite-BIFS', 'EEE-Technologies', 'Elite-Jobs', 'Elite-Cards', 'Elite-Associate', 'Elite-Properties', 'Elite-Paisa', 'Elite-Management']
  },
  category: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  featuredImage: {
    type: String,
    default: null
  },
  status: {
    type: String,
    default: 'draft',
    enum: ['draft', 'published', 'archived']
  },
  author: {
    type: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
      email: { type: String },
      role: { type: String },
      name: { type: String }
    },
    default: null 
  },
  publishedAt: {
    type: Date,
    default: null
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
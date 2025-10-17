import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
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

const Image = mongoose.model("Image", imageSchema);

export default Image;
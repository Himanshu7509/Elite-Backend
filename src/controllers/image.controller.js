import Image from "../models/image.model.js";
import s3 from "../config/s3.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

// Memory storage for multer
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Upload image to AWS S3
const uploadToS3 = async (file) => {
  const fileKey = `images/${uuidv4()}-${file.originalname}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const uploaded = await s3.upload(params).promise();
  return uploaded.Location; // Return public URL
};

// Delete image from AWS S3
const deleteFromS3 = async (imageUrl) => {
  try {
    // Extract image key from URL
    const key = imageUrl.split(".amazonaws.com/")[1]; // everything after the domain
    
    // Delete image from S3
    await s3
      .deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })
      .promise();
  } catch (error) {
    console.error("Error deleting image from S3:", error);
    throw error;
  }
};

// POST: Create Image
export const createImage = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!req.file) return res.status(400).json({ message: "Image is required" });

    const imgUrl = await uploadToS3(req.file);

    const image = new Image({
      name,
      imageUrl: imgUrl,
      createdBy: req.user.email,
      creatorRole: req.user.role,
    });

    await image.save();
    res.status(201).json({
      success: true,
      message: "Image created successfully",
      data: image,
    });
  } catch (error) {
    console.error("Error creating image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create image",
      error: error.message,
    });
  }
};

// GET: Fetch all images
export const getAllImages = async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: images });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch images",
      error: error.message,
    });
  }
};

// GET: Fetch image by ID
export const getImageById = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);
    
    if (!image) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }
    
    res.status(200).json({ success: true, data: image });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch image",
      error: error.message,
    });
  }
};

// PUT: Update image by ID
export const updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    const updateData = { name };
    
    // If a new image is uploaded, update it
    if (req.file) {
      // First, delete the old image from S3
      const oldImage = await Image.findById(id);
      if (oldImage && oldImage.imageUrl) {
        await deleteFromS3(oldImage.imageUrl);
      }
      
      // Upload new image
      const imgUrl = await uploadToS3(req.file);
      updateData.imageUrl = imgUrl;
    }
    
    const updatedImage = await Image.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedImage) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }
    
    res.status(200).json({
      success: true,
      message: "Image updated successfully",
      data: updatedImage,
    });
  } catch (error) {
    console.error("Error updating image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update image",
      error: error.message,
    });
  }
};

// DELETE: Remove an image + its file from S3
export const deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }

    // Delete image from S3
    if (image.imageUrl) {
      await deleteFromS3(image.imageUrl);
    }

    // Delete from MongoDB
    await Image.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Image and file deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete image",
      error: error.message,
    });
  }
};

// NEW: Share image via email
export const shareImageViaEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { leadIds, subject, message } = req.body;
    
    // Find the image
    const image = await Image.findById(id);
    if (!image) {
      return res.status(404).json({ success: false, message: "Image not found" });
    }
    
    // Add image URL as an attachment URL to the email
    const attachmentUrls = [image.imageUrl];
    const attachmentNames = [`${image.name || 'shared-image'}.jpg`];
    
    // Add attachment data to request body
    req.body.attachmentUrls = attachmentUrls;
    req.body.attachmentNames = attachmentNames;
    
    // Import the sendGroupMail function and call it directly
    const mailController = await import('./mail.contoller.js');
    return await mailController.sendGroupMail(req, res);
  } catch (error) {
    console.error("Error sharing image via email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to share image via email",
      error: error.message,
    });
  }
};

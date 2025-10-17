import B2B from "../models/b2b.model.js";
import s3 from "../config/s3.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

// Memory storage for multer
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Upload image to AWS S3
const uploadToS3 = async (file) => {
  const fileKey = `b2bImages/${uuidv4()}-${file.originalname}`;
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

// POST: Create B2B Detail
export const createB2BDetail = async (req, res) => {
  try {
    const { instituteName, clientName, phoneNo, contactNo, instituteEmail, status, location, visitingDate, visitingTime } = req.body;
    
    if (!req.file) return res.status(400).json({ message: "Image is required" });

    const imgUrl = await uploadToS3(req.file);

    const b2bDetail = new B2B({
      instituteName,
      clientName,
      phoneNo,
      contactNo,
      instituteEmail,
      status,
      location,
      visitingDate,
      visitingTime,
      image: imgUrl,
      createdBy: req.user.email,
      creatorRole: req.user.role,
    });

    await b2bDetail.save();
    res.status(201).json({
      success: true,
      message: "B2B detail created successfully",
      data: b2bDetail,
    });
  } catch (error) {
    console.error("Error creating B2B detail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create B2B detail",
      error: error.message,
    });
  }
};

// GET: Fetch all B2B details (Admin and Manager can see all, Sales can only see their own)
export const getAllB2BDetails = async (req, res) => {
  try {
    let query = {};
    
    // Sales users can only see their own records
    if (req.user.role === "sales") {
      query.createdBy = req.user.email;
    }
    
    const details = await B2B.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch B2B details",
      error: error.message,
    });
  }
};

// GET: Fetch B2B detail by ID (with access control)
export const getB2BDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const detail = await B2B.findById(id);
    
    if (!detail) {
      return res.status(404).json({ success: false, message: "B2B detail not found" });
    }
    
    // Sales users can only access their own records
    if (req.user.role === "sales" && detail.createdBy !== req.user.email) {
      return res.status(403).json({ success: false, message: "Access denied. You can only access your own records." });
    }
    
    res.status(200).json({ success: true, data: detail });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch B2B detail",
      error: error.message,
    });
  }
};

// PUT: Update B2B detail by ID (with access control)
export const updateB2BDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { instituteName, clientName, phoneNo, contactNo, instituteEmail, status, location, visitingDate, visitingTime } = req.body;
    
    // First, check if the record exists and if the user has access to it
    const existingDetail = await B2B.findById(id);
    
    if (!existingDetail) {
      return res.status(404).json({ success: false, message: "B2B detail not found" });
    }
    
    // Sales users can only update their own records
    if (req.user.role === "sales" && existingDetail.createdBy !== req.user.email) {
      return res.status(403).json({ success: false, message: "Access denied. You can only update your own records." });
    }
    
    const updateData = {
      instituteName,
      clientName,
      phoneNo,
      contactNo,
      instituteEmail,
      status,
      location,
      visitingDate,
      visitingTime,
    };
    
    // If a new image is uploaded, update it
    if (req.file) {
      // Delete the old image from S3
      if (existingDetail.image) {
        await deleteFromS3(existingDetail.image);
      }
      
      // Upload new image
      const imgUrl = await uploadToS3(req.file);
      updateData.image = imgUrl;
    }
    
    const updatedDetail = await B2B.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedDetail) {
      return res.status(404).json({ success: false, message: "B2B detail not found" });
    }
    
    res.status(200).json({
      success: true,
      message: "B2B detail updated successfully",
      data: updatedDetail,
    });
  } catch (error) {
    console.error("Error updating B2B detail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update B2B detail",
      error: error.message,
    });
  }
};

// DELETE: Remove a B2B detail + its image from S3 (Admin and Manager can delete, Sales cannot)
export const deleteB2BDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // First, check if the record exists
    const b2bDetail = await B2B.findById(id);
    if (!b2bDetail) {
      return res.status(404).json({ success: false, message: "B2B detail not found" });
    }

    // Sales users cannot delete records
    if (req.user.role === "sales") {
      return res.status(403).json({ success: false, message: "Access denied. Sales users cannot delete records." });
    }

    // Sales users can only delete their own records (but they can't delete at all as per requirements)
    if (req.user.role === "sales" && b2bDetail.createdBy !== req.user.email) {
      return res.status(403).json({ success: false, message: "Access denied. You can only delete your own records." });
    }

    // Delete image from S3
    if (b2bDetail.image) {
      await deleteFromS3(b2bDetail.image);
    }

    // Delete from MongoDB
    await B2B.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "B2B detail and image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting B2B detail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete B2B detail",
      error: error.message,
    });
  }
};
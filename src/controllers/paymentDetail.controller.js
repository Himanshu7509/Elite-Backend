import PaymentDetail from "../models/paymentDetail.model.js";
import Team from "../models/team.model.js";
import s3 from "../config/s3.js";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";


// Memory storage for multer
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Upload image to AWS S3
const uploadToS3 = async (file) => {
  const fileKey = `paymentImages/${uuidv4()}-${file.originalname}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const uploaded = await s3.upload(params).promise();
  return uploaded.Location; // Return public URL
};

// POST: Create Payment Detail
export const createPaymentDetail = async (req, res) => {
  try {
    const { name, details } = req.body;
    if (!req.file) return res.status(400).json({ message: "Image is required" });

    // Prepare the payment detail data with tracking information
    const paymentData = { name, details };
    
    // If user is authenticated, track who created the payment detail
    if (req.user) {
      // Set creator email and role for all users
      paymentData.creatorEmail = req.user.email;
      paymentData.creatorRole = req.user.role;
      
      // If it's a database user (has _id), set the createdBy reference
      if (req.user._id) {
        paymentData.createdBy = req.user._id;
      }
    } else {
      // If no user is authenticated
      paymentData.creatorEmail = "unknown";
      paymentData.creatorRole = "unknown";
    }

    const imgUrl = await uploadToS3(req.file);
    paymentData.uploadImg = imgUrl;

    const paymentDetail = new PaymentDetail(paymentData);
    await paymentDetail.save();
    
    res.status(201).json({
      success: true,
      message: "Payment detail created successfully",
      data: paymentDetail,
    });
  } catch (error) {
    console.error("Error creating payment detail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment detail",
      error: error.message,
    });
  }
};

// GET: Fetch payment details based on user role
export const getAllPaymentDetails = async (req, res) => {
  try {
    const user = req.user; // populated from verifyToken middleware
    let filter = {};

    if (user.role === "admin") {
      // Admin can see all payment details
      filter = {};
    } else if (user.role === "manager" || user.role === "sales") {
      // Manager and sales can only see payment details they created
      // For static users (no _id), filter by creatorEmail
      // For database users (with _id), filter by createdBy
      if (user._id) {
        // Database user - filter by createdBy field
        filter = { createdBy: user._id };
      } else {
        // Static user - filter by creatorEmail field
        filter = { creatorEmail: user.email };
      }
    } else {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Invalid user role." 
      });
    }

    // Populate the createdBy field with user information
    const details = await PaymentDetail.find(filter)
      .populate('createdBy', 'name email role')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, data: details });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message,
    });
  }
};

// DELETE: Remove a payment detail + its image from S3
export const deletePaymentDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has permission to delete this payment detail
    const payment = await PaymentDetail.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    // Check permissions based on user role
    const user = req.user;
    let hasPermission = false;

    if (user.role === "admin") {
      // Admin can delete any payment detail
      hasPermission = true;
    } else if (user.role === "manager" || user.role === "sales") {
      // Manager and sales can only delete their own payment details
      if (user._id && payment.createdBy) {
        // Database user - check createdBy field
        if (payment.createdBy.toString() === user._id.toString()) {
          hasPermission = true;
        }
      } else {
        // Static user - check creatorEmail field
        if (payment.creatorEmail === user.email) {
          hasPermission = true;
        }
      }
    }

    if (!hasPermission) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. You can only delete payment details you created." 
      });
    }

    // Extract image key from URL
    const imageUrl = payment.uploadImg;
    const key = imageUrl.split(".amazonaws.com/")[1]; // everything after the domain

    // Delete image from S3
    await s3
      .deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })
      .promise();

    // Delete from MongoDB
    await PaymentDetail.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Payment and image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete payment",
      error: error.message,
    });
  }
};
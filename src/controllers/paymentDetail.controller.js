import PaymentDetail from "../models/paymentDetail.model.js";
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

    const imgUrl = await uploadToS3(req.file);

    const paymentDetail = new PaymentDetail({
      name,
      details,
      uploadImg: imgUrl,
    });

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

// GET: Fetch all payment details
export const getAllPaymentDetails = async (req, res) => {
  try {
    const details = await PaymentDetail.find().sort({ createdAt: -1 });
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

    const payment = await PaymentDetail.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
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

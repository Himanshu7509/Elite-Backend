import s3 from "../config/s3.js";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

export const uploadFileToS3 = async (file) => {
  // Validate required environment variables
  const bucketName = process.env.AWS_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error("AWS_BUCKET_NAME is not defined in environment variables");
  }

  // Validate file
  if (!file) {
    throw new Error("No file provided for upload");
  }

  // Create the S3 upload parameters without ACL
  const fileKey = `social-media/${uuidv4()}-${file.originalname}`;
  const params = {
    Bucket: bucketName,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  try {
    // Upload the file to S3 using promise()
    const uploaded = await s3.upload(params).promise();
    console.log("File uploaded to S3 successfully:", uploaded);
    return uploaded;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw error;
  }
};
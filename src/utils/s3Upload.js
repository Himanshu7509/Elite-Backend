import s3 from "../config/s3.js";
import dotenv from "dotenv";
dotenv.config();

export const uploadFileToS3 = (file) => {
  return new Promise((resolve, reject) => {
    // Set the S3 bucket name from environment variables
    const bucketName = process.env.AWS_BUCKET_NAME;
    
    if (!bucketName) {
      return reject(new Error("AWS_BUCKET_NAME is not defined in environment variables"));
    }

    // Create the S3 upload parameters
    const params = {
      Bucket: bucketName,
      Key: `social-media/${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };

    // Upload the file to S3
    s3.upload(params, (err, data) => {
      if (err) {
        console.error("Error uploading file to S3:", err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};
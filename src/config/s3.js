import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

// Validate required environment variables
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
  console.error("Missing AWS configuration environment variables");
  console.error("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "Present" : "Missing");
  console.error("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "Present" : "Missing");
  console.error("AWS_REGION:", process.env.AWS_REGION ? "Present" : "Missing");
}

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

export default s3;
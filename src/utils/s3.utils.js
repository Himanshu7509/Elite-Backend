import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

const s3 = new AWS.S3();

// Upload file to S3
export const uploadFileToS3 = async (file, folder = 'general') => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${folder}/${Date.now()}_${file.originalname.replace(/\s+/g, '_')}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const result = await s3.upload(params).promise();
    return result;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
};

// Delete file from S3
export const deleteFileFromS3 = async (key) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  try {
    await s3.deleteObject(params).promise();
    return { success: true };
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};

// Get file from S3
export const getFileFromS3 = async (key) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  try {
    const result = await s3.getObject(params).promise();
    return result;
  } catch (error) {
    console.error('Error getting file from S3:', error);
    throw error;
  }
};

// Generate signed URL for temporary access
export const generateSignedUrl = async (key, expiresIn = 3600) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Expires: expiresIn,
  };

  try {
    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};

export default {
  uploadFileToS3,
  deleteFileFromS3,
  getFileFromS3,
  generateSignedUrl,
};
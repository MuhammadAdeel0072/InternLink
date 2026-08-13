import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Configure Cloudinary if environment variables are available
const isConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.log('Cloudinary credentials not set. Falling back to local file storage.');
}

/**
 * Uploads a file buffer to Cloudinary, or falls back to local file storage
 * @param {Object} file - The file object from Multer (with buffer, originalname, mimetype)
 * @returns {Promise<string>} The uploaded URL
 */
export const uploadToCloudinary = async (file) => {
  if (!file) return '';

  if (!isConfigured) {
    // Fallback: Save to local filesystem
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Ensure the uploads directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename to prevent caching issues
    const ext = path.extname(file.originalname || '') || (file.mimetype === 'application/pdf' ? '.pdf' : '.jpg');
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    const filePath = path.join(uploadDir, filename);
    
    fs.writeFileSync(filePath, file.buffer);
    
    // Construct the absolute URL using BACKEND_URL or fallback
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    return `${baseUrl}/uploads/${filename}`;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'internlink'
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Upload Error:', error);
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(file.buffer);
  });
};

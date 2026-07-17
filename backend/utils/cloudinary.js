import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

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
  console.log('Cloudinary credentials not set. Falling back to base64 Data URLs for file storage.');
}

/**
 * Uploads a file buffer to Cloudinary, or falls back to a base64 Data URI
 * @param {Object} file - The file object from Multer (with buffer, originalname, mimetype)
 * @returns {Promise<string>} The uploaded URL or the base64 fallback URI
 */
export const uploadToCloudinary = async (file) => {
  if (!file) return '';

  if (!isConfigured) {
    // Fallback: Convert to base64 data URL
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;
    return dataURI;
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

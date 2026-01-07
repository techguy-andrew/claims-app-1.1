import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

// Configure Cloudinary with environment variables
// Uses CLOUDINARY_CLOUD_NAME for server-side, falls back to NEXT_PUBLIC for backward compatibility
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }

// Image file extensions and MIME types
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'];
const IMAGE_MIMETYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
];

/**
 * Check if a file is an image (should be routed to Cloudinary)
 */
export function isImageFile(mimeType: string, filename: string): boolean {
  if (IMAGE_MIMETYPES.includes(mimeType.toLowerCase())) return true;
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? IMAGE_EXTENSIONS.includes(ext) : false;
}

/**
 * Check if a URL is a Cloudinary URL
 */
export function isCloudinaryUrl(url: string): boolean {
  return url.includes('cloudinary.com') || url.includes('res.cloudinary.com');
}

interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
}

/**
 * Upload an image buffer to Cloudinary
 * Cloudinary automatically handles HEIC/HEIF conversion
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder: string;
    filename: string;
  }
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        public_id: options.filename,
        resource_type: 'image',
        format: 'jpg', // Force JPEG output (handles HEIC conversion)
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        } else {
          reject(new Error('No result from Cloudinary upload'));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Delete an image from Cloudinary by public_id
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Generate a thumbnail URL from a Cloudinary URL
 * Inserts transformation parameters after /upload/
 */
export function getCloudinaryThumbnailUrl(url: string, width: number = 300, height: number = 300): string {
  return url.replace('/upload/', `/upload/c_thumb,w_${width},h_${height},g_auto/`);
}

// Helper to generate thumbnail URL from a Cloudinary URL (legacy)
export function getThumbnailUrl(publicId: string, format: string = 'jpg'): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width: 150, height: 150, crop: 'thumb', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    format,
  })
}

// Helper to generate optimized delivery URL (legacy)
export function getOptimizedUrl(publicId: string, format: string = 'jpg'): string {
  return cloudinary.url(publicId, {
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
    ],
    format,
  })
}

// Upload options for different file types (legacy)
export const uploadOptions = {
  folder: 'claims',
  resource_type: 'auto' as const,
  allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx'],
  max_bytes: 10 * 1024 * 1024, // 10MB
}

import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export { cloudinary }

// Helper to generate thumbnail URL from a Cloudinary URL
export function getThumbnailUrl(publicId: string, format: string = 'jpg'): string {
  return cloudinary.url(publicId, {
    transformation: [
      { width: 150, height: 150, crop: 'thumb', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
    format,
  })
}

// Helper to generate optimized delivery URL
export function getOptimizedUrl(publicId: string, format: string = 'jpg'): string {
  return cloudinary.url(publicId, {
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
    ],
    format,
  })
}

// Upload options for different file types
export const uploadOptions = {
  folder: 'claims',
  resource_type: 'auto' as const,
  allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx'],
  max_bytes: 10 * 1024 * 1024, // 10MB
}

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2 client configured for Cloudflare's S3-compatible API
export const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // Retry configuration for reliability
  maxAttempts: 3,
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME!;
export const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN!;

/**
 * Generate a presigned PUT URL for client-side uploads
 * @param key - The object key (path) in R2
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration in seconds (default 1 hour)
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generate a presigned GET URL for secure downloads
 * @param key - The object key (path) in R2
 * @param filename - Optional filename for Content-Disposition header
 * @param expiresIn - URL expiration in seconds (default 1 hour)
 */
export async function getPresignedDownloadUrl(
  key: string,
  filename?: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ResponseContentDisposition: filename
      ? `attachment; filename="${filename}"`
      : undefined,
  });
  return getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Upload a file to R2 (server-side)
 * @param key - The object key (path) in R2
 * @param body - File buffer to upload
 * @param contentType - MIME type of the file
 */
export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

/**
 * Delete an object from R2
 * @param key - The object key (path) in R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}

/**
 * Get the public URL for an object (requires public bucket or custom domain)
 * @param key - The object key (path) in R2
 */
export function getPublicUrl(key: string): string {
  return `${R2_PUBLIC_DOMAIN}/${key}`;
}

/**
 * Get thumbnail URL for an image
 * Note: Cloudflare Image Resizing (/cdn-cgi/image/) requires a custom domain,
 * not available on *.r2.dev public URLs. Returns direct URL for now.
 * @param key - The object key (path) in R2
 * @param width - Desired width in pixels (ignored until custom domain is set up)
 */
export function getImageVariantUrl(key: string, width: number): string {
  // Image Resizing not available on r2.dev domains
  // Return direct URL - browser/CSS will scale for display
  return `${R2_PUBLIC_DOMAIN}/${key}`;
}

/**
 * Check if a publicId/key is an R2 file vs legacy Cloudinary
 * R2 keys follow pattern: claims/{claimId}/{itemId}/{timestamp}-{randomId}.{ext}
 * This has exactly 4 path segments and the filename starts with a timestamp
 */
export function isR2File(publicId: string): boolean {
  const segments = publicId.split("/");
  if (segments.length !== 4 || segments[0] !== "claims") {
    return false;
  }
  // Check if filename starts with a timestamp (13+ digits)
  const filename = segments[3];
  return /^\d{13,}-/.test(filename);
}

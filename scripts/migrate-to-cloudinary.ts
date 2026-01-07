/**
 * Migration Script: Move all attachments to new Cloudinary account
 *
 * This script migrates existing attachments from R2 or old Cloudinary
 * to the new Cloudinary account.
 *
 * SAFETY FEATURES:
 * - Original files are NEVER deleted (kept as backups)
 * - Dry-run mode to preview changes
 * - Skips non-image files (PDFs stay on R2)
 * - Skips files already on the new Cloudinary account
 * - Logs all operations for audit trail
 *
 * Usage:
 *   pnpm migrate:cloudinary:dry   # Preview changes (dry run)
 *   pnpm migrate:cloudinary       # Execute migration
 */

import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const R2_ONLY = args.includes("--r2-only");

// Initialize Prisma
const prisma = new PrismaClient();

// Get the new Cloudinary cloud name from environment
const NEW_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

// Old/developer Cloudinary accounts to skip (not client's account)
const SKIP_CLOUD_NAMES = ["debqautsy"];

if (!NEW_CLOUD_NAME) {
  console.error("ERROR: CLOUDINARY_CLOUD_NAME environment variable is not set");
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: NEW_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Processing delay to avoid rate limits (ms between files)
const BATCH_DELAY = 500;

// Image MIME types to migrate
const IMAGE_MIMETYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
  failures: { id: string; filename: string; error: string }[];
}

interface AttachmentRecord {
  id: string;
  itemId: string;
  filename: string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string;
  publicId: string;
  item: {
    claimId: string;
  };
}

/**
 * Check if URL is from the NEW Cloudinary account
 */
function isNewCloudinaryUrl(url: string): boolean {
  return url.includes(`res.cloudinary.com/${NEW_CLOUD_NAME}`);
}

/**
 * Check if URL is from ANY Cloudinary account
 */
function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

/**
 * Check if URL is from an old/developer Cloudinary account that should be skipped
 */
function isOldCloudinaryUrl(url: string): boolean {
  return SKIP_CLOUD_NAMES.some((name) => url.includes(`res.cloudinary.com/${name}`));
}

/**
 * Check if URL is from R2
 */
function isR2Url(url: string): boolean {
  return url.includes("r2.dev") || url.includes("r2.cloudflarestorage");
}

/**
 * Check if file is an image
 */
function isImageFile(mimeType: string): boolean {
  return IMAGE_MIMETYPES.includes(mimeType.toLowerCase());
}

/**
 * Download file from URL and return as Buffer
 */
async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload buffer to Cloudinary
 */
async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  filename: string
): Promise<{
  url: string;
  thumbnailUrl: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: "image",
        unique_filename: false,
        overwrite: true, // Allow overwrite in case of re-run
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          // Generate thumbnail URL
          const thumbnailUrl = result.secure_url.replace(
            "/upload/",
            "/upload/c_thumb,w_300,h_300,g_auto/"
          );
          resolve({
            url: result.secure_url,
            thumbnailUrl,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          });
        } else {
          reject(new Error("No result from Cloudinary upload"));
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Extract a clean filename from the URL or original filename
 */
function extractFilename(url: string, originalFilename: string): string {
  // Try to get filename from URL path
  try {
    const urlPath = new URL(url).pathname;
    const urlFilename = urlPath.split("/").pop() || "";
    // Remove extension if present
    const nameWithoutExt = urlFilename.replace(/\.[^/.]+$/, "");
    if (nameWithoutExt) {
      return nameWithoutExt;
    }
  } catch {
    // URL parsing failed, use original filename
  }

  // Fall back to original filename without extension
  return originalFilename.replace(/\.[^/.]+$/, "");
}

/**
 * Migrate a single attachment
 */
async function migrateAttachment(
  attachment: AttachmentRecord
): Promise<{ success: boolean; error?: string; skipped?: boolean }> {
  const { id, url, filename, mimeType, item } = attachment;
  const claimId = item.claimId;

  try {
    console.log(`  Processing: ${filename} (${id})`);

    // Skip if already on new Cloudinary
    if (isNewCloudinaryUrl(url)) {
      console.log(`    → Already on new Cloudinary, skipping`);
      return { success: true, skipped: true };
    }

    // Skip old developer Cloudinary accounts (test images)
    if (isOldCloudinaryUrl(url)) {
      console.log(`    → Old developer Cloudinary account, skipping`);
      return { success: true, skipped: true };
    }

    // Skip if not an image
    if (!isImageFile(mimeType)) {
      console.log(`    → Not an image (${mimeType}), skipping`);
      return { success: true, skipped: true };
    }

    // Determine source
    const source = isR2Url(url) ? "R2" : isCloudinaryUrl(url) ? "Old Cloudinary" : "Unknown";
    console.log(`    Source: ${source}`);

    // Build target folder and filename
    const folder = `claims/${claimId}/${attachment.itemId}`;
    const targetFilename = extractFilename(url, filename);

    if (DRY_RUN) {
      console.log(`    [DRY RUN] Would migrate:`);
      console.log(`      From: ${url}`);
      console.log(`      To: Cloudinary folder ${folder}/${targetFilename}`);
      return { success: true };
    }

    // Download the file
    console.log(`    Downloading from ${source}...`);
    const buffer = await downloadFile(url);
    console.log(`    Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Upload to new Cloudinary
    console.log(`    Uploading to Cloudinary...`);
    const result = await uploadToCloudinary(buffer, folder, targetFilename);
    console.log(`    Uploaded: ${result.url}`);

    // Update database record
    console.log(`    Updating database...`);
    await prisma.attachment.update({
      where: { id },
      data: {
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        publicId: result.publicId,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        mimeType: "image/jpeg", // Cloudinary normalizes to JPEG
      },
    });

    console.log(`    ✓ Successfully migrated`);
    return { success: true };
  } catch (error) {
    let errorMsg: string;
    if (error instanceof Error) {
      errorMsg = error.message;
    } else if (typeof error === 'object' && error !== null) {
      // Cloudinary errors are objects with message property
      errorMsg = JSON.stringify(error, null, 2);
    } else {
      errorMsg = String(error);
    }
    console.error(`    ✗ Failed: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main migration function
 */
async function migrate(): Promise<MigrationResult> {
  console.log("═".repeat(70));
  console.log("Attachment Migration to Cloudinary");
  console.log("═".repeat(70));
  console.log(`Target Cloudinary account: ${NEW_CLOUD_NAME}`);

  if (DRY_RUN) {
    console.log("\n⚠️  DRY RUN MODE - No changes will be made\n");
  } else {
    console.log("\n🔒 SAFETY: Original files will be preserved (not deleted)\n");
  }

  const result: MigrationResult = {
    total: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    failures: [],
  };

  // Fetch all attachments with their item's claimId
  console.log("Querying database for attachments...");
  const attachments = await prisma.attachment.findMany({
    select: {
      id: true,
      itemId: true,
      filename: true,
      url: true,
      thumbnailUrl: true,
      mimeType: true,
      publicId: true,
      item: {
        select: {
          claimId: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  result.total = attachments.length;
  console.log(`Found ${result.total} attachment(s) to process\n`);

  if (result.total === 0) {
    console.log("No attachments found. Nothing to migrate.");
    return result;
  }

  // Categorize attachments
  const alreadyOnNewCloudinary = attachments.filter((a) => isNewCloudinaryUrl(a.url));
  const oldCloudinary = attachments.filter((a) => isOldCloudinaryUrl(a.url));
  const nonImages = attachments.filter(
    (a) => !isNewCloudinaryUrl(a.url) && !isOldCloudinaryUrl(a.url) && !isImageFile(a.mimeType)
  );
  const toMigrate = attachments.filter(
    (a) => !isNewCloudinaryUrl(a.url) && !isOldCloudinaryUrl(a.url) && isImageFile(a.mimeType)
  );

  console.log("Summary:");
  console.log(`  Already on new Cloudinary: ${alreadyOnNewCloudinary.length}`);
  console.log(`  Old dev Cloudinary (skip): ${oldCloudinary.length}`);
  console.log(`  Non-images (will skip):    ${nonImages.length}`);
  console.log(`  To migrate:                ${toMigrate.length}`);
  console.log("");

  // Process each attachment
  for (let i = 0; i < attachments.length; i++) {
    const attachment = attachments[i];
    console.log(`\n[${i + 1}/${result.total}] ${attachment.filename}`);

    const migrationResult = await migrateAttachment(attachment);

    if (migrationResult.skipped) {
      result.skipped++;
    } else if (migrationResult.success) {
      result.migrated++;
    } else {
      result.failed++;
      result.failures.push({
        id: attachment.id,
        filename: attachment.filename,
        error: migrationResult.error || "Unknown error",
      });
    }

    // Add delay between files to avoid rate limits
    if (!DRY_RUN && i < attachments.length - 1 && !migrationResult.skipped) {
      await sleep(BATCH_DELAY);
    }
  }

  return result;
}

/**
 * Print final summary
 */
function printSummary(result: MigrationResult): void {
  console.log("\n" + "═".repeat(70));
  console.log(DRY_RUN ? "Dry Run Summary" : "Migration Summary");
  console.log("═".repeat(70));
  console.log(`Total attachments:    ${result.total}`);
  console.log(`Skipped:              ${result.skipped}`);
  console.log(`${DRY_RUN ? "Would migrate" : "Migrated"}:        ${result.migrated}`);
  console.log(`Failed:               ${result.failed}`);

  if (result.failures.length > 0) {
    console.log("\nFailed files:");
    result.failures.forEach((f) => {
      console.log(`  - ${f.filename} (${f.id}): ${f.error}`);
    });
  }

  if (DRY_RUN) {
    console.log("\n💡 Run without --dry-run to execute the migration");
  } else if (result.migrated > 0) {
    console.log("\n✅ Migration complete. Original files preserved as backups.");
  }

  console.log("═".repeat(70));
}

// Run migration
migrate()
  .then((result) => {
    printSummary(result);
    process.exit(result.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error("\nFatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

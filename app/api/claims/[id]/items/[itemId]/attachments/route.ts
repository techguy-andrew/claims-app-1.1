import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToR2, getPublicUrl } from "@/lib/r2";
import { uploadToCloudinary, isImageFile, getCloudinaryThumbnailUrl } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * POST /api/claims/[id]/items/[itemId]/attachments
 * Upload file to Cloudinary (images) or R2 (documents)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: claimId, itemId } = await params;

    // Verify item exists and belongs to the claim
    const item = await prisma.item.findFirst({
      where: { id: itemId, claimId },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 100MB limit" },
        { status: 400 }
      );
    }

    // Get file data
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "bin";
    const baseFilename = file.name.replace(/\.[^/.]+$/, "");
    const randomId = Math.random().toString(36).substring(2, 10);

    // Route based on file type: images → Cloudinary, documents → R2
    if (isImageFile(file.type, file.name)) {
      // CLOUDINARY PATH for images
      // Cloudinary handles HEIC/HEIF conversion automatically
      const folder = `claims/${claimId}/${itemId}`;
      const filename = `${Date.now()}-${randomId}-${baseFilename}`;

      const result = await uploadToCloudinary(buffer, { folder, filename });

      // Generate thumbnail URL using Cloudinary transforms
      const thumbnailUrl = getCloudinaryThumbnailUrl(result.url);

      // Save attachment metadata
      const attachment = await prisma.attachment.create({
        data: {
          itemId,
          filename: file.name,
          url: result.url,
          thumbnailUrl,
          mimeType: "image/jpeg", // Cloudinary converts to JPEG
          size: result.bytes,
          width: result.width || null,
          height: result.height || null,
          publicId: result.publicId,
          version: null,
          format: result.format,
        },
      });

      return NextResponse.json(attachment, { status: 201 });
    } else {
      // R2 PATH for documents (PDF, DOC, etc.)
      const key = `claims/${claimId}/${itemId}/${Date.now()}-${randomId}.${ext}`;

      await uploadToR2(key, buffer, file.type);

      const url = getPublicUrl(key);

      // Save attachment metadata
      const attachment = await prisma.attachment.create({
        data: {
          itemId,
          filename: file.name,
          url,
          thumbnailUrl: null, // Documents don't have thumbnails
          mimeType: file.type,
          size: buffer.length,
          width: null,
          height: null,
          publicId: key,
          version: null,
          format: ext,
        },
      });

      return NextResponse.json(attachment, { status: 201 });
    }
  } catch (error) {
    console.error("Failed to upload attachment:", error);
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/claims/[id]/items/[itemId]/attachments
 * Get all attachments for an item
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: claimId, itemId } = await params;

    // Verify item exists and belongs to the claim
    const item = await prisma.item.findFirst({
      where: { id: itemId, claimId },
      include: { attachments: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item.attachments);
  } catch (error) {
    console.error("Failed to fetch attachments:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachments" },
      { status: 500 }
    );
  }
}

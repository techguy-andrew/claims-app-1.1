import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromR2 } from "@/lib/r2";
import { deleteFromCloudinary, isCloudinaryUrl } from "@/lib/cloudinary";

/**
 * DELETE /api/claims/[id]/items/[itemId]/attachments/[attachmentId]
 * Delete attachment from storage (R2 or Cloudinary) and database
 */
export async function DELETE(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; itemId: string; attachmentId: string }> }
) {
  try {
    const { id: claimId, itemId, attachmentId } = await params;

    // Verify attachment exists and belongs to the correct item/claim
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        itemId,
        item: { claimId },
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Delete from storage based on URL (Cloudinary URLs contain cloudinary.com)
    try {
      if (isCloudinaryUrl(attachment.url)) {
        // Cloudinary file (new or legacy)
        await deleteFromCloudinary(attachment.publicId);
      } else {
        // R2 file
        await deleteFromR2(attachment.publicId);
      }
    } catch (storageError) {
      // Log but don't fail - file might already be deleted
      console.error("Storage delete error:", storageError);
    }

    // Delete from database
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete attachment:", error);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/claims/[id]/items/[itemId]/attachments/[attachmentId]
 * Get single attachment metadata
 */
export async function GET(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; itemId: string; attachmentId: string }> }
) {
  try {
    const { id: claimId, itemId, attachmentId } = await params;

    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        itemId,
        item: { claimId },
      },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(attachment);
  } catch (error) {
    console.error("Failed to fetch attachment:", error);
    return NextResponse.json(
      { error: "Failed to fetch attachment" },
      { status: 500 }
    );
  }
}

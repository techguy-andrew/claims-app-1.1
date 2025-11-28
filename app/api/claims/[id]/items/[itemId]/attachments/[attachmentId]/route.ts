import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteFromR2, isR2File } from "@/lib/r2";
import { cloudinary } from "@/lib/cloudinary";

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

    // Delete from storage (R2 or Cloudinary based on key format)
    try {
      if (isR2File(attachment.publicId)) {
        // R2 file - delete from R2
        await deleteFromR2(attachment.publicId);
      } else {
        // Legacy Cloudinary file - delete from Cloudinary
        await cloudinary.uploader.destroy(attachment.publicId);
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

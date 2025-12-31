import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/r2";

/**
 * POST /api/claims/[id]/items/[itemId]/attachments/upload-signature
 * Generate a presigned URL for direct R2 upload
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: claimId, itemId } = await params;
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename and contentType are required" },
        { status: 400 }
      );
    }

    // Generate unique key with folder structure
    // Format: claims/{claimId}/{itemId}/{timestamp}-{random}.{ext}
    const ext = filename.split(".").pop() || "bin";
    const randomId = Math.random().toString(36).substring(2, 10);
    const key = `claims/${claimId}/${itemId}/${Date.now()}-${randomId}.${ext}`;

    const uploadUrl = await getPresignedUploadUrl(key, contentType);

    return NextResponse.json({
      uploadUrl,
      key,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
  } catch (error) {
    console.error("Error generating upload signature:", error);
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}

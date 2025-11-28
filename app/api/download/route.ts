import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET, isR2File } from "@/lib/r2";
import { Readable } from "stream";

// Configure Cloudinary for legacy files (with analytics disabled)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  url_analytics: false,
});

const MIME_TYPES: Record<string, string> = {
  // Images
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  gif: "image/gif",
  // Documents
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // Videos
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  avi: "video/x-msvideo",
  mkv: "video/x-matroska",
  // Audio
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publicId = searchParams.get("publicId") || searchParams.get("key");
    const resourceType = searchParams.get("resourceType") || "raw";
    const format = searchParams.get("format") || "";
    const filename = searchParams.get("filename") || "download";

    if (!publicId) {
      return NextResponse.json(
        { error: "Missing publicId/key parameter" },
        { status: 400 }
      );
    }

    // Sanitize filename for Content-Disposition header
    const safeFilename = filename.replace(/[<>:"/\\|?*]/g, "_");

    // Check if this is an R2 file or legacy Cloudinary file
    if (isR2File(publicId)) {
      // R2 file - fetch and proxy with proper headers
      const response = await r2Client.send(
        new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: publicId,
        })
      );

      // Convert stream to buffer
      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": response.ContentType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${safeFilename}"`,
          "Content-Length": String(response.ContentLength || buffer.length),
        },
      });
    }

    // Legacy Cloudinary file - use existing logic
    let cloudinaryUrl = cloudinary.url(publicId, {
      resource_type: resourceType as "image" | "raw" | "video",
      type: "upload",
      secure: true,
      sign_url: true,
    });

    // Strip analytics param if still present (it corrupts the signature)
    if (cloudinaryUrl.includes("?_a=")) {
      cloudinaryUrl = cloudinaryUrl.split("?")[0];
    }

    // Fetch file from Cloudinary (server-side bypasses CORS)
    const response = await fetch(cloudinaryUrl);

    if (!response.ok) {
      console.error(
        `Cloudinary fetch failed: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        { error: "Failed to fetch file from storage" },
        { status: response.status }
      );
    }

    const fileBuffer = await response.arrayBuffer();

    // Determine Content-Type from filename extension or format
    const ext = filename.split(".").pop()?.toLowerCase() || format;
    const contentType =
      MIME_TYPES[ext] ||
      response.headers.get("content-type") ||
      "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Content-Length": String(fileBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error("Download proxy error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}

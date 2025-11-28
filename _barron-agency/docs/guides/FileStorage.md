# R2 File Storage Implementation

> Documentation for the Cloudflare R2 file storage system used in the Claims App.

## 1. Architecture Overview

### File Flow: Upload

```
┌─────────────┐     FormData      ┌─────────────┐    S3 API     ┌─────────────┐
│   Browser   │ ─────────────────▶│  Next.js    │ ─────────────▶│ Cloudflare  │
│   (Client)  │                   │  API Route  │               │     R2      │
└─────────────┘                   └─────────────┘               └─────────────┘
                                        │
                                        │ Prisma
                                        ▼
                                  ┌─────────────┐
                                  │    Neon     │
                                  │  PostgreSQL │
                                  └─────────────┘
```

1. **Client** sends file via `FormData` to `/api/claims/[id]/items/[itemId]/attachments`
2. **API Route** validates size (100MB max), generates unique key, uploads to R2
3. **Database** stores metadata (filename, URL, size, mimeType, R2 key)

### File Flow: Viewing/Download

```
┌─────────────┐                   ┌─────────────┐
│   Browser   │ ◀────────────────▶│  R2 Public  │  (direct for viewing)
└─────────────┘                   │    URL      │
       │                          └─────────────┘
       │
       │ /api/download            ┌─────────────┐    S3 API     ┌─────────────┐
       └─────────────────────────▶│  Next.js    │ ─────────────▶│     R2      │
                                  │  API Route  │               │             │
                                  └─────────────┘               └─────────────┘
                                  (proxied for download with proper headers)
```

- **Viewing**: Direct public R2 URL (fast, CDN-cached)
- **Downloading**: Proxied through API with proper `Content-Disposition` headers

### What's Stored Where

| Location | Data |
|----------|------|
| **R2** | Actual file bytes (images, PDFs, videos, documents) |
| **Neon** | Metadata: filename, URL, size, mimeType, R2 key (`publicId`), dimensions, timestamps |

---

## 2. Cloudflare R2 Setup

### Bucket Configuration

| Setting | Value |
|---------|-------|
| Bucket name | `claims-app-files` |
| Region | `auto` (Cloudflare chooses optimal) |
| Storage class | Standard |

### CORS Policy

Configure in Cloudflare Dashboard → R2 → Bucket → Settings → CORS:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-production-domain.com"],
    "AllowedMethods": ["GET", "PUT", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### Public Access

1. Go to R2 bucket → Settings → Public access
2. Enable "Allow public access"
3. Copy the public URL (format: `https://pub-{hash}.r2.dev`)

### API Token Permissions

Create an R2 API token with:
- **Permission**: Object Read & Write
- **Scope**: Specific bucket (`claims-app-files`) or All buckets

---

## 3. Environment Variables

```bash
# Cloudflare R2 Storage
R2_ACCOUNT_ID=your_cloudflare_account_id        # Found in Cloudflare dashboard URL
R2_ACCESS_KEY_ID=your_r2_api_token_access_key   # From API token creation
R2_SECRET_ACCESS_KEY=your_r2_api_token_secret   # From API token creation
R2_BUCKET_NAME=claims-app-files                 # Your bucket name
R2_PUBLIC_DOMAIN=https://pub-xxx.r2.dev         # Public bucket URL
R2_ENDPOINT=https://{account_id}.r2.cloudflarestorage.com  # S3 API endpoint

# Legacy (for existing Cloudinary files)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

**Configuration locations:**
- Local: `.env` file (git-ignored)
- Production: Vercel Environment Variables

---

## 4. Code Implementation

### Key Files

| File | Purpose |
|------|---------|
| `lib/r2.ts` | R2 client, upload/delete/URL functions |
| `app/api/claims/[id]/items/[itemId]/attachments/route.ts` | Upload endpoint (POST), list attachments (GET) |
| `app/api/claims/[id]/items/[itemId]/attachments/[attachmentId]/route.ts` | Delete endpoint, get single attachment |
| `app/api/download/route.ts` | Download proxy with proper headers |
| `lib/hooks/useAttachments.ts` | React hooks for upload/delete mutations |

### Upload Flow

```typescript
// 1. Client (useAttachments.ts)
const formData = new FormData();
formData.append("file", file);
await fetch(`/api/claims/${claimId}/items/${itemId}/attachments`, {
  method: "POST",
  body: formData,
});

// 2. API Route (attachments/route.ts)
const file = formData.get("file") as File;
const key = `claims/${claimId}/${itemId}/${Date.now()}-${randomId}.${ext}`;
const buffer = Buffer.from(await file.arrayBuffer());
await uploadToR2(key, buffer, file.type);

// 3. R2 Client (lib/r2.ts)
await r2Client.send(new PutObjectCommand({
  Bucket: R2_BUCKET,
  Key: key,
  Body: body,
  ContentType: contentType,
}));
```

### Download Flow

```typescript
// API Route proxies R2 file with proper headers
const response = await r2Client.send(new GetObjectCommand({
  Bucket: R2_BUCKET,
  Key: publicId,
}));

return new NextResponse(buffer, {
  headers: {
    "Content-Type": response.ContentType,
    "Content-Disposition": `attachment; filename="${filename}"`,
  },
});
```

### Delete Flow

```typescript
// 1. Delete from R2
await deleteFromR2(attachment.publicId);

// 2. Delete from database
await prisma.attachment.delete({ where: { id: attachmentId } });
```

### Image Thumbnails

Currently returns the direct R2 URL (no resizing):

```typescript
export function getImageVariantUrl(key: string, width: number): string {
  // Cloudflare Image Resizing requires custom domain (not *.r2.dev)
  return `${R2_PUBLIC_DOMAIN}/${key}`;
}
```

**Future**: With a custom domain, use Cloudflare Image Resizing:
```
https://files.yourdomain.com/cdn-cgi/image/width=150,format=auto/${key}
```

---

## 5. Database Schema

```prisma
model Attachment {
  id           String   @id @default(cuid())
  itemId       String                         // Foreign key to Item
  filename     String                         // Original filename
  url          String                         // R2 public URL for viewing
  thumbnailUrl String?                        // Thumbnail URL (same as url currently)
  mimeType     String                         // MIME type (image/jpeg, video/mp4, etc.)
  size         Int                            // File size in bytes
  width        Int?                           // Image/video width (if applicable)
  height       Int?                           // Image/video height (if applicable)
  publicId     String                         // R2 key (e.g., claims/abc/def/123.jpg)
  version      String?                        // Reserved for versioning
  format       String?                        // File extension
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  item         Item     @relation(...)        // Cascade delete with parent item

  @@index([itemId])
}
```

**Key field**: `publicId` stores the R2 object key, used for:
- Deleting from R2
- Distinguishing R2 files from legacy Cloudinary files

---

## 6. Migration Notes (Cloudinary → R2)

### Dual-Mode Support

The system supports both R2 (new) and Cloudinary (legacy) files:

```typescript
// lib/r2.ts
export function isR2File(publicId: string): boolean {
  // R2 keys follow pattern: claims/{claimId}/{itemId}/{timestamp}-{randomId}.{ext}
  const segments = publicId.split("/");
  if (segments.length !== 4 || segments[0] !== "claims") {
    return false;
  }
  // Check if filename starts with a timestamp (13+ digits)
  const filename = segments[3];
  return /^\d{13,}-/.test(filename);
}
```

This detection works because:
- **R2 files** have exactly 4 path segments with a timestamp-prefixed filename
- **Cloudinary files** have simpler paths like `claims/filename` or folder-less IDs

### How It Works

| Operation | R2 Files | Cloudinary Files |
|-----------|----------|------------------|
| **Upload** | Always R2 | N/A (no new uploads) |
| **View** | Direct R2 URL | Direct Cloudinary URL |
| **Download** | Proxy via API | Proxy via API (signed URL) |
| **Delete** | `deleteFromR2()` | `cloudinary.uploader.destroy()` |

### Migration Strategy

- **No migration needed**: Existing Cloudinary files continue to work
- **New uploads**: Automatically go to R2
- **Gradual transition**: As users delete/re-upload, files move to R2

---

## 7. Limitations & Future Considerations

### Current Limitations

| Limitation | Current Value | Notes |
|------------|---------------|-------|
| Max file size | 100MB | Vercel body limit may be lower on some plans |
| Request timeout | 60s (Vercel Pro) | Large file uploads may timeout |
| Image resizing | Not available | Requires custom domain for Cloudflare Image Resizing |

### Vercel Considerations

- **Hobby plan**: 4.5MB body limit (upgrade needed for large files)
- **Pro plan**: 100MB body limit, 60s timeout
- **Streaming**: Currently buffering entire file; consider streaming for large files

### Future Improvements

1. **Presigned URLs for large files**
   - Skip server, upload directly to R2
   - Avoids Vercel body limits and timeouts
   - Requires CORS configuration

2. **Chunked uploads**
   - For files > 100MB
   - Use S3 multipart upload API

3. **Image resizing**
   - Add custom domain to Cloudflare
   - Enable Image Resizing in Cloudflare dashboard
   - Use `/cdn-cgi/image/` URLs

4. **Video transcoding**
   - Consider Cloudflare Stream for video optimization
   - Automatic adaptive bitrate streaming

---

## Quick Reference

### R2 Key Format
```
claims/{claimId}/{itemId}/{timestamp}-{randomId}.{extension}
```

### Public URL Format
```
https://pub-{hash}.r2.dev/claims/{claimId}/{itemId}/{filename}
```

### API Endpoints
```
POST   /api/claims/[id]/items/[itemId]/attachments        # Upload
GET    /api/claims/[id]/items/[itemId]/attachments        # List
GET    /api/claims/[id]/items/[itemId]/attachments/[id]   # Get one
DELETE /api/claims/[id]/items/[itemId]/attachments/[id]   # Delete
GET    /api/download?publicId=...&filename=...            # Download
```

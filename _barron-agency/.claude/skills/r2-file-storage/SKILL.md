---
name: r2-file-storage
description: Cloudflare R2 file storage patterns for upload, download, and deletion. Use when working with file attachments, implementing upload endpoints, or managing stored files.
---

# Cloudflare R2 File Storage

This skill covers the complete R2 integration pattern used in this project.

## Environment Variables

```bash
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_api_token_access_key
R2_SECRET_ACCESS_KEY=your_r2_api_token_secret
R2_BUCKET_NAME=claims-app-files
R2_PUBLIC_DOMAIN=https://pub-xxx.r2.dev
R2_ENDPOINT=https://{account_id}.r2.cloudflarestorage.com
```

## R2 Client Setup (`lib/r2.ts`)

```typescript
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    })
  )
}

export async function getFromR2(key: string) {
  return r2Client.send(
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    })
  )
}

export function getPublicUrl(key: string): string {
  return `${process.env.R2_PUBLIC_DOMAIN}/${key}`
}
```

## Key Naming Convention

```
claims/{claimId}/{itemId}/{timestamp}-{randomId}.{extension}
```

Example: `claims/clm_abc123/itm_xyz789/1699123456789-a1b2c3.pdf`

## Upload API Route Pattern

```typescript
import { uploadToR2, getPublicUrl } from '@/lib/r2'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest, { params }: Params) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { claimId, itemId } = await params
  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  // Validate file
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  // Generate key and upload
  const ext = file.name.split('.').pop() || 'bin'
  const key = `claims/${claimId}/${itemId}/${Date.now()}-${nanoid(6)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  await uploadToR2(key, buffer, file.type)

  // Save to database
  const attachment = await prisma.attachment.create({
    data: {
      itemId,
      filename: file.name,
      url: getPublicUrl(key),
      mimeType: file.type,
      size: file.size,
      publicId: key, // Store R2 key for deletion
    },
  })

  return NextResponse.json(attachment, { status: 201 })
}
```

## Download Proxy Pattern

For files that need auth or custom headers:

```typescript
// app/api/download/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')

  if (!key) {
    return NextResponse.json({ error: 'Key required' }, { status: 400 })
  }

  const response = await getFromR2(key)
  const buffer = await response.Body?.transformToByteArray()

  if (!buffer) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const filename = key.split('/').pop() || 'download'

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': response.ContentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
```

## Delete Pattern

```typescript
export async function DELETE(request: NextRequest, { params }: Params) {
  const { attachmentId } = await params

  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
  })

  if (!attachment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Delete from R2 first
  await deleteFromR2(attachment.publicId)

  // Then delete database record
  await prisma.attachment.delete({
    where: { id: attachmentId },
  })

  return NextResponse.json({ success: true })
}
```

## Dual-Mode (Legacy Cloudinary Support)

For backward compatibility during migration:

```typescript
function isR2Key(publicId: string): boolean {
  // R2 keys start with 'claims/'
  return publicId.startsWith('claims/')
}

async function deleteFile(publicId: string): Promise<void> {
  if (isR2Key(publicId)) {
    await deleteFromR2(publicId)
  } else {
    // Legacy Cloudinary
    await cloudinary.uploader.destroy(publicId)
  }
}
```

## Thumbnail Generation

For images, consider generating thumbnails on upload:

```typescript
import sharp from 'sharp'

async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(200, 200, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer()
}
```
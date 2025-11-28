import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cloudinary, getThumbnailUrl } from '@/lib/cloudinary'

// POST /api/claims/[id]/items/[itemId]/attachments - Upload files
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: claimId, itemId } = await params

    // Verify item exists and belongs to the claim
    const item = await prisma.item.findFirst({
      where: { id: itemId, claimId },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // Parse FormData
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Upload each file to Cloudinary and create attachment records
    const attachments = await Promise.all(
      files.map(async (file) => {
        // Convert file to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Determine resource type based on MIME type
        // Images use 'image', everything else (PDFs, docs) use 'raw'
        const isImage = file.type.startsWith('image/')
        const resourceType = isImage ? 'image' : 'raw'

        // Upload to Cloudinary
        const uploadResult = await new Promise<{
          public_id: string
          secure_url: string
          format: string
          bytes: number
          width?: number
          height?: number
          version: number
          resource_type: string
        }>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: `claims/${claimId}/${itemId}`,
                public_id: `${Date.now()}-${file.name.replace(/\.[^/.]+$/, '')}`,
                resource_type: resourceType,
              },
              (error, result) => {
                if (error) reject(error)
                else resolve(result as typeof result & { public_id: string; secure_url: string; format: string; bytes: number; version: number; resource_type: string })
              }
            )
            .end(buffer)
        })

        // Generate thumbnail URL for images only
        const thumbnailUrl = isImage
          ? getThumbnailUrl(uploadResult.public_id, uploadResult.format)
          : null

        // Create attachment record in database
        const attachment = await prisma.attachment.create({
          data: {
            itemId,
            filename: file.name,
            url: uploadResult.secure_url,
            thumbnailUrl,
            mimeType: file.type,
            size: uploadResult.bytes,
            width: uploadResult.width || null,
            height: uploadResult.height || null,
            publicId: uploadResult.public_id,
            version: String(uploadResult.version),
            format: uploadResult.format,
          },
        })

        return attachment
      })
    )

    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Failed to upload files:', error)
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    )
  }
}

// GET /api/claims/[id]/items/[itemId]/attachments - Get all attachments for an item
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: claimId, itemId } = await params

    // Verify item exists and belongs to the claim
    const item = await prisma.item.findFirst({
      where: { id: itemId, claimId },
      include: { attachments: true },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(item.attachments)
  } catch (error) {
    console.error('Failed to fetch attachments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}

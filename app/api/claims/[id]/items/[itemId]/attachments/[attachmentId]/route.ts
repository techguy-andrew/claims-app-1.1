import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cloudinary } from '@/lib/cloudinary'

// DELETE /api/claims/[id]/items/[itemId]/attachments/[attachmentId] - Delete attachment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string; attachmentId: string }> }
) {
  try {
    const { id: claimId, itemId, attachmentId } = await params

    // Verify attachment exists and belongs to the correct item/claim
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        itemId,
        item: { claimId },
      },
    })

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      )
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(attachment.publicId)
    } catch (cloudinaryError) {
      // Log but don't fail - file might already be deleted from Cloudinary
      console.error('Cloudinary delete error:', cloudinaryError)
    }

    // Delete from database
    await prisma.attachment.delete({
      where: { id: attachmentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete attachment:', error)
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    )
  }
}

// GET /api/claims/[id]/items/[itemId]/attachments/[attachmentId] - Get single attachment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string; attachmentId: string }> }
) {
  try {
    const { id: claimId, itemId, attachmentId } = await params

    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        itemId,
        item: { claimId },
      },
    })

    if (!attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(attachment)
  } catch (error) {
    console.error('Failed to fetch attachment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachment' },
      { status: 500 }
    )
  }
}

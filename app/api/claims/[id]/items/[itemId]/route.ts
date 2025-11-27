import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/claims/[id]/items/[itemId] - Get single item
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: { attachments: true },
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to fetch item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    )
  }
}

// PATCH /api/claims/[id]/items/[itemId] - Update item
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params
    const body = await request.json()
    const { title, description, order } = body

    const updateData: { title?: string; description?: string; order?: number } = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (order !== undefined) updateData.order = order

    const item = await prisma.item.update({
      where: { id: itemId },
      data: updateData,
      include: { attachments: true },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Failed to update item:', error)
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
}

// DELETE /api/claims/[id]/items/[itemId] - Delete item
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params

    await prisma.item.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}

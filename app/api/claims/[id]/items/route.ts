import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/claims/[id]/items - Create new item
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params
    const body = await request.json()
    const { title, description } = body

    // Get the current max order for items in this claim
    const maxOrder = await prisma.item.aggregate({
      where: { claimId },
      _max: { order: true },
    })

    const newOrder = (maxOrder._max.order ?? -1) + 1

    const item = await prisma.item.create({
      data: {
        title: title || '',
        description: description || '',
        order: body.order ?? newOrder,
        claimId,
      },
      include: {
        attachments: true,
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Failed to create item:', error)
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    )
  }
}

// PATCH /api/claims/[id]/items - Reorder items
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: claimId } = await params
    const body = await request.json()
    const { items } = body as { items: Array<{ id: string; order: number }> }

    // Update all item orders in a transaction
    await prisma.$transaction(
      items.map((item) =>
        prisma.item.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    )

    // Return updated items
    const updatedItems = await prisma.item.findMany({
      where: { claimId },
      orderBy: { order: 'asc' },
      include: { attachments: true },
    })

    return NextResponse.json(updatedItems)
  } catch (error) {
    console.error('Failed to reorder items:', error)
    return NextResponse.json(
      { error: 'Failed to reorder items' },
      { status: 500 }
    )
  }
}

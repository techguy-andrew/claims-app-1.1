import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/claims/[id] - Get single claim with items and attachments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        claimant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          orderBy: { order: 'asc' },
          include: {
            attachments: true,
          },
        },
      },
    })

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(claim)
  } catch (error) {
    console.error('Failed to fetch claim:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claim' },
      { status: 500 }
    )
  }
}

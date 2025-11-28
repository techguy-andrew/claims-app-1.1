import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/claims - List all claims with item counts
export async function GET() {
  try {
    const claims = await prisma.claim.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        claimant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    })

    return NextResponse.json(claims)
  } catch (error) {
    console.error('Failed to fetch claims:', error)
    return NextResponse.json(
      { error: 'Failed to fetch claims' },
      { status: 500 }
    )
  }
}

// POST /api/claims - Create a new claim
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      customer,
      adjustorName,
      adjustorPhone,
      adjustorEmail,
      claimantName,
      claimantPhone,
      claimantEmail,
      claimantAddress
    } = body

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Get or create a default user for development (no auth yet)
    // TODO: Replace with actual authenticated user when auth is implemented
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: 'dev-user',
          email: 'dev@example.com',
          name: 'Development User',
        },
      })
    }

    const claim = await prisma.claim.create({
      data: {
        title: title.trim(),
        customer: customer?.trim() || null,
        adjustorName: adjustorName?.trim() || null,
        adjustorPhone: adjustorPhone?.trim() || null,
        adjustorEmail: adjustorEmail?.trim() || null,
        claimantName: claimantName?.trim() || null,
        claimantPhone: claimantPhone?.trim() || null,
        claimantEmail: claimantEmail?.trim() || null,
        claimantAddress: claimantAddress?.trim() || null,
        claimantId: user.id,
      },
      include: {
        claimant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
    })

    return NextResponse.json(claim, { status: 201 })
  } catch (error) {
    console.error('Failed to create claim:', error)
    return NextResponse.json(
      { error: 'Failed to create claim' },
      { status: 500 }
    )
  }
}

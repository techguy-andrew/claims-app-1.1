import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { prisma } from '@/lib/prisma'
import { ClaimPDF } from '@/_barron-agency/components/ClaimPDF'
import React from 'react'
import sharp from 'sharp'

// Allow longer execution time for PDF generation with many images
export const maxDuration = 60

// Helper to fetch image and convert to JPEG base64 data URI
// Uses sharp to convert any image format (WebP, HEIC, PNG, etc.) to JPEG
// because @react-pdf/renderer only supports JPEG and PNG
async function fetchImageAsBase64(url: string, filename: string): Promise<string | null> {
  const startTime = Date.now()

  try {
    console.log(`[PDF] Fetching image: ${filename} from ${url.substring(0, 80)}...`)

    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000), // 30 second timeout (increased from 15s)
    })

    if (!response.ok) {
      console.error(`[PDF] Image fetch failed: ${response.status} ${response.statusText} - ${filename}`)
      return null
    }

    const buffer = await response.arrayBuffer()

    if (buffer.byteLength === 0) {
      console.error(`[PDF] Empty image buffer: ${filename}`)
      return null
    }

    // Use sharp to convert and resize image for PDF embedding
    try {
      const jpegBuffer = await sharp(Buffer.from(buffer))
        .rotate() // Auto-rotate based on EXIF orientation metadata
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true }) // Limit size for PDF
        .jpeg({ quality: 75 })
        .toBuffer()

      const elapsed = Date.now() - startTime
      console.log(`[PDF] Image processed: ${filename} (${buffer.byteLength} → ${jpegBuffer.length} bytes, ${elapsed}ms)`)

      return `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`
    } catch (sharpError) {
      console.error(`[PDF] Sharp failed to process: ${filename}`, sharpError)
      return null
    }
  } catch (error) {
    const elapsed = Date.now() - startTime
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      console.error(`[PDF] Image fetch timeout after ${elapsed}ms: ${filename}`)
    } else {
      console.error(`[PDF] Image fetch error: ${filename}`, error)
    }
    return null
  }
}

// GET /api/claims/[id]/pdf - Generate and download PDF
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch claim with items and attachments
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
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

    // Get or create share link
    let shareLink = await prisma.shareLink.findUnique({
      where: { claimId: id },
    })

    if (!shareLink) {
      shareLink = await prisma.shareLink.create({
        data: { claimId: id },
      })
    }

    // Build share URL
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const shareUrl = `${protocol}://${host}/share/${shareLink.token}`

    // Pre-fetch all images and convert to base64 to avoid hanging during PDF render
    // Count total images for logging
    const totalImages = claim.items.reduce(
      (count, item) => count + item.attachments.filter((a) => a.mimeType.startsWith('image/')).length,
      0
    )
    console.log(`[PDF] Processing claim ${claim.claimNumber} with ${totalImages} images...`)

    const processedClaim = {
      ...claim,
      items: await Promise.all(
        claim.items.map(async (item) => ({
          ...item,
          attachments: await Promise.all(
            item.attachments.map(async (att) => {
              if (att.mimeType.startsWith('image/')) {
                const base64Url = await fetchImageAsBase64(att.url, att.filename)
                return { ...att, base64Url }
              }
              return { ...att, base64Url: null }
            })
          ),
        }))
      ),
    }

    // Log success/failure summary
    const successCount = processedClaim.items.reduce(
      (count, item) => count + item.attachments.filter((a) => a.base64Url).length,
      0
    )
    console.log(`[PDF] Images embedded: ${successCount}/${totalImages}`)

    // Render PDF to buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfElement = React.createElement(ClaimPDF, { claim: processedClaim, shareUrl }) as any
    const buffer = await renderToBuffer(pdfElement)

    // Return PDF with download headers
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Claim-${claim.claimNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}

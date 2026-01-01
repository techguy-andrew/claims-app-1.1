import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { prisma } from '@/lib/prisma'
import { ClaimPDF } from '@/_barron-agency/components/ClaimPDF'
import React from 'react'
import sharp from 'sharp'

// Allow longer execution time for PDF generation with many images
export const maxDuration = 60

// Helper to fetch image and convert to JPEG base64 data URI
async function fetchImageAsBase64(url: string, filename: string): Promise<string | null> {
  const startTime = Date.now()

  try {
    console.log(`[PDF] Fetching image: ${filename} from ${url.substring(0, 80)}...`)

    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
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

    try {
      const jpegBuffer = await sharp(Buffer.from(buffer))
        .rotate()
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
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

// GET /api/share/[token]/pdf - Generate and download PDF for shared claim
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Look up share link by token
    const shareLink = await prisma.shareLink.findUnique({
      where: { token },
      include: {
        claim: {
          include: {
            items: {
              orderBy: { order: 'asc' },
              include: {
                attachments: true,
              },
            },
          },
        },
      },
    })

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Share link not found or has been revoked' },
        { status: 404 }
      )
    }

    const claim = shareLink.claim

    // Build share URL
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const shareUrl = `${protocol}://${host}/share/${token}`

    // Pre-fetch all images and convert to base64
    const totalImages = claim.items.reduce(
      (count, item) => count + item.attachments.filter((a) => a.mimeType.startsWith('image/')).length,
      0
    )
    console.log(`[PDF] Processing shared claim ${claim.claimNumber} with ${totalImages} images...`)

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

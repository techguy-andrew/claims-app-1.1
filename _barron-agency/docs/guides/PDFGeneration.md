# PDF Generation Guide

Server-side PDF generation for claims documents using `@react-pdf/renderer` and `sharp` for image processing.

## Overview

The PDF generation system creates professional, branded claim documents that include:
- Claim header with status badge
- Adjustor and claimant contact information
- All items with their descriptions
- Image attachments rendered inline
- Clickable share link for online viewing

## Architecture

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `ClaimPDF` | `components/ClaimPDF.tsx` | React-PDF document template |
| `DownloadClaimPDF` | `components/DownloadClaimPDF.tsx` | Client-side download trigger button |

### API Endpoint

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/claims/[id]/pdf` | GET | Generates and returns PDF stream |

## Data Flow

```
1. User clicks "Download PDF" button (DownloadClaimPDF)
           ↓
2. Button triggers fetch to /api/claims/[id]/pdf
           ↓
3. API route fetches claim with items and attachments
           ↓
4. Images converted to base64 JPEG via sharp (for PDF embedding)
           ↓
5. Share link auto-created if none exists
           ↓
6. ClaimPDF component renders with @react-pdf/renderer
           ↓
7. PDF stream returned to browser for download
```

## Image Handling

The PDF generation system processes images to ensure compatibility with `@react-pdf/renderer`:

### Conversion Process
- **Input formats:** WebP, HEIC, PNG, JPG, and other formats
- **Output format:** JPEG (base64 encoded data URI)
- **Timeout:** 15 seconds per image
- **Fallback:** If conversion fails, image is skipped (graceful degradation)

### Code Pattern (from API route)
```typescript
// Fetch and convert image to base64 JPEG
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(15000)
    })
    const buffer = await response.arrayBuffer()

    // Convert to JPEG using sharp
    const jpegBuffer = await sharp(Buffer.from(buffer))
      .jpeg({ quality: 80 })
      .toBuffer()

    return `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`
  } catch (error) {
    console.error('Image fetch failed:', error)
    return null
  }
}
```

## Styling

The PDF uses a design token system converted to hex values for `@react-pdf/renderer` compatibility:

```typescript
// Color palette matching globals.css design tokens
const colors = {
  background: '#ffffff',
  foreground: '#0a0a1a',
  card: '#ffffff',
  cardForeground: '#0a0a1a',
  muted: '#f4f4f8',
  mutedForeground: '#6b7280',
  border: '#e4e4e9',
  primary: '#1a1a2e',
  success: '#16a34a',
  destructive: '#dc2626',
  warning: '#f59e0b',
}

// Status badge colors
const statusColors: Record<ClaimStatus, { bg: string; text: string }> = {
  PENDING: { bg: '#fef3c7', text: '#92400e' },
  UNDER_REVIEW: { bg: '#dbeafe', text: '#1e40af' },
  APPROVED: { bg: '#dcfce7', text: '#166534' },
  REJECTED: { bg: '#fee2e2', text: '#991b1b' },
  CLOSED: { bg: '#f3f4f6', text: '#374151' },
}
```

## Usage

### Basic Usage

```tsx
import { DownloadClaimPDF } from '@/_barron-agency/components/DownloadClaimPDF'

function ClaimPage({ claimId }: { claimId: string }) {
  return (
    <div>
      <h1>Claim Details</h1>
      <DownloadClaimPDF claimId={claimId} />
    </div>
  )
}
```

### DownloadClaimPDF Props

```typescript
interface DownloadClaimPDFProps {
  /** The claim ID to generate PDF for */
  claimId: string
  /** Optional additional class names */
  className?: string
}
```

## PDF Document Structure

The generated PDF includes these sections:

### 1. Header
- Claim number (large title)
- Customer name (if provided)
- Status badge with color coding
- Share link for online viewing

### 2. Claim Details Section
Two-column layout:
- **Adjustor column:** Name, phone, email
- **Claimant column:** Name, phone, email, address

### 3. Items Section
For each item:
- Item number and title
- Description
- Attachment thumbnails (80x80px grid)
- "View online" links for each attachment

### 4. Footer (fixed)
- Generation date
- Share link

## Dependencies

```json
{
  "@react-pdf/renderer": "^4.x",
  "sharp": "^0.33.x"
}
```

## Share Link Integration

The PDF endpoint automatically creates a share link if one doesn't exist, ensuring the PDF always includes a working online link. This is handled in the API route:

```typescript
// Auto-create share link if needed
let shareLink = await db.shareLink.findUnique({
  where: { claimId }
})

if (!shareLink) {
  shareLink = await db.shareLink.create({
    data: { claimId }
  })
}

const shareUrl = `${baseUrl}/share/${shareLink.token}`
```

## Limitations & Future Improvements

### Current Limitations
- Large PDFs with many images may timeout on serverless platforms
- No chunked/streaming generation for very large claims
- PDF-only attachments show placeholder (cannot embed PDFs in PDFs)

### Potential Improvements
- Background PDF generation with job queue
- Cached/pre-generated PDFs for frequently accessed claims
- Configurable page layouts (landscape, letter size)
- Custom branding per client (logo, colors)

---

**Version:** 1.1.0
**Last Updated:** December 2025

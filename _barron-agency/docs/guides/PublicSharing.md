# Public Share Links Guide

Token-based public access system for sharing claims with external parties without requiring authentication.

## Overview

The share link system allows claim owners to generate unique, revocable links that provide read-only access to claim details. This enables:
- Sharing claims with adjustors, clients, or other stakeholders
- Including viewable links in PDF exports
- Controlled access without user account creation

## Architecture

### Database Model

```prisma
model ShareLink {
  id        String   @id @default(cuid())
  token     String   @unique @default(cuid())
  claimId   String   @unique
  claim     Claim    @relation(fields: [claimId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@index([token])
}
```

**Key Design Decisions:**
- One share link per claim (`claimId` is unique)
- CUID tokens for security (not sequential, not guessable)
- Cascade delete: removing a claim removes its share link
- Token indexed for fast lookup

### Component

| Component | Location | Purpose |
|-----------|----------|---------|
| `ShareClaimButton` | `components/ShareClaimButton.tsx` | Dropdown button for link management |

### Hooks

Located in `lib/hooks/useShareLinks.ts`:

| Hook | Purpose |
|------|---------|
| `useShareLink(claimId)` | Fetch existing share link for a claim |
| `useCreateShareLink()` | Create new share link mutation |
| `useRevokeShareLink()` | Delete share link with optimistic update |
| `buildShareUrl(token)` | Construct full URL from token |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/claims/[id]/share` | GET | Get existing share link |
| `/api/claims/[id]/share` | POST | Create or return existing share link |
| `/api/claims/[id]/share` | DELETE | Revoke (delete) share link |
| `/api/share/[token]` | GET | Public endpoint - fetch claim by token |

## Usage

### ShareClaimButton Component

```tsx
import { ShareClaimButton } from '@/_barron-agency/components/ShareClaimButton'

function ClaimHeader({ claimId }: { claimId: string }) {
  return (
    <div className="flex items-center gap-4">
      <h1>Claim Details</h1>
      <ShareClaimButton claimId={claimId} />
    </div>
  )
}
```

### Props Interface

```typescript
interface ShareClaimButtonProps {
  /** The claim ID to share */
  claimId: string
  /** Optional additional class names */
  className?: string
}
```

### Button Behavior

1. **No existing link:** Shows "Generate & Copy Link" option
2. **Link exists:** Shows "Copy Link" and "Revoke Link" options
3. **Link info:** Displays creation date when link exists

## Hook Usage

### Fetching Share Link Status

```typescript
import { useShareLink } from '@/lib/hooks/useShareLinks'

function ShareStatus({ claimId }: { claimId: string }) {
  const { data: shareLink, isLoading } = useShareLink(claimId)

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {shareLink ? (
        <p>Shared since: {new Date(shareLink.createdAt).toLocaleDateString()}</p>
      ) : (
        <p>Not shared</p>
      )}
    </div>
  )
}
```

### Creating Share Links

```typescript
import { useCreateShareLink, buildShareUrl } from '@/lib/hooks/useShareLinks'

function ShareButton({ claimId }: { claimId: string }) {
  const createShareLink = useCreateShareLink()

  const handleShare = async () => {
    const link = await createShareLink.mutateAsync(claimId)
    const url = buildShareUrl(link.token)
    await navigator.clipboard.writeText(url)
    // Show success toast
  }

  return (
    <button onClick={handleShare} disabled={createShareLink.isPending}>
      {createShareLink.isPending ? 'Creating...' : 'Share'}
    </button>
  )
}
```

### Revoking Share Links

```typescript
import { useRevokeShareLink } from '@/lib/hooks/useShareLinks'

function RevokeButton({ claimId }: { claimId: string }) {
  const revokeShareLink = useRevokeShareLink()

  const handleRevoke = async () => {
    await revokeShareLink.mutateAsync(claimId)
    // Show success toast
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={revokeShareLink.isPending}
      className="text-destructive"
    >
      Revoke Access
    </button>
  )
}
```

## Public View Page

The public share page is located at `app/(public)/share/[token]/page.tsx`:

### Features
- Read-only display of claim details
- All items and attachments visible
- Professional layout with TopBar
- No edit capabilities
- No authentication required

### URL Pattern
```
https://your-domain.com/share/{token}
```

Example: `https://claims.example.com/share/clx7abc123def456`

## Security Considerations

### Token Security
- **CUID tokens:** 25-character unique identifiers
- **Not guessable:** No sequential patterns
- **Indexed lookup:** Direct database query, no enumeration possible

### Access Control
- **Read-only:** Public pages cannot modify data
- **Revocable:** Link owners can revoke at any time
- **Cascade delete:** Claim deletion removes share link

### Best Practices
- Revoke links when no longer needed
- Don't share links with sensitive claims unnecessarily
- Consider adding expiration in future versions

## API Implementation Details

### GET /api/claims/[id]/share

```typescript
// Returns existing share link or 404
export async function GET(request, { params }) {
  const shareLink = await db.shareLink.findUnique({
    where: { claimId: params.id }
  })

  if (!shareLink) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json(shareLink)
}
```

### POST /api/claims/[id]/share

```typescript
// Creates new or returns existing (idempotent)
export async function POST(request, { params }) {
  const existing = await db.shareLink.findUnique({
    where: { claimId: params.id }
  })

  if (existing) {
    return Response.json(existing)
  }

  const shareLink = await db.shareLink.create({
    data: { claimId: params.id }
  })

  return Response.json(shareLink)
}
```

### DELETE /api/claims/[id]/share

```typescript
// Revokes share link
export async function DELETE(request, { params }) {
  await db.shareLink.delete({
    where: { claimId: params.id }
  })

  return Response.json({ success: true })
}
```

### GET /api/share/[token]

```typescript
// Public endpoint - fetches claim by token
export async function GET(request, { params }) {
  const shareLink = await db.shareLink.findUnique({
    where: { token: params.token },
    include: {
      claim: {
        include: {
          items: {
            include: { attachments: true },
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  })

  if (!shareLink) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json(shareLink.claim)
}
```

## Optimistic Updates

The revoke mutation uses optimistic updates for instant UI feedback:

```typescript
useMutation({
  mutationFn: async (claimId: string) => {
    await fetch(`/api/claims/${claimId}/share`, { method: 'DELETE' })
  },

  onMutate: async (claimId) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['shareLink', claimId] })

    // Snapshot previous value
    const previousShareLink = queryClient.getQueryData(['shareLink', claimId])

    // Optimistically remove
    queryClient.setQueryData(['shareLink', claimId], null)

    return { previousShareLink }
  },

  onError: (err, claimId, context) => {
    // Rollback on error
    if (context?.previousShareLink) {
      queryClient.setQueryData(['shareLink', claimId], context.previousShareLink)
    }
  },
})
```

## Future Improvements

- **Expiring links:** Add `expiresAt` field for time-limited access
- **Password protection:** Optional password for sensitive claims
- **Access logging:** Track when/how often links are accessed
- **Multiple links:** Allow multiple links with different permissions
- **Link preview customization:** OG tags for social sharing

---

**Version:** 1.1.0
**Last Updated:** December 2025

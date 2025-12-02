# Claims Management Application

## Project Overview

A full-stack claims management application for tracking insurance claims, items, and file attachments. Built with a portable, reusable component architecture following the Barron Agency foundation principles.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS v4 with CSS custom properties for theming
- **Database**: PostgreSQL via Neon (serverless, with staging branches)
- **ORM**: Prisma (type-safe queries, migrations)
- **Auth**: Clerk (user management)
- **File Storage**: Cloudflare R2 (dual-mode: legacy Cloudinary + new R2)
- **State**: React Query (optimistic updates, caching)
- **Animations**: Motion (formerly Framer Motion)
- **Package Manager**: pnpm
- **Hosting**: Vercel

## Project Structure

```
app/
├── (app)/                # Authenticated routes (AppLayout wrapper)
│   ├── layout.tsx        # Uses AppLayout with TopBar + Sidebar
│   ├── page.tsx          # Home page
│   ├── claims/
│   │   ├── page.tsx      # Claims list
│   │   └── [id]/page.tsx # Claim detail with items
│   └── demo/             # Demo page
├── (public)/             # Public routes (minimal layout)
│   └── share/[token]/    # Public claim view (read-only)
├── api/
│   ├── claims/           # Claims CRUD + nested items/attachments
│   │   └── [id]/
│   │       ├── share/    # Share link management
│   │       └── pdf/      # PDF generation
│   ├── share/[token]/    # Public claim endpoint
│   └── download/         # File download endpoint
├── layout.tsx
└── globals.css

lib/
├── prisma.ts             # Prisma client singleton
├── r2.ts                 # Cloudflare R2 client (PRIMARY storage)
├── cloudinary.ts         # Legacy Cloudinary client
└── hooks/
    ├── useClaims.ts
    ├── useItems.ts
    ├── useAttachments.ts
    └── useShareLinks.ts  # Share link mutations

_barron-agency/           # Reusable component library
├── components/           # 34 UI components
├── config/               # App configuration + navigation
├── hooks/                # Reusable utility hooks
├── icons/                # 20 SVG icon components
├── providers/            # React context providers
├── styles/               # Theme configurations
├── types/                # TypeScript type definitions
└── utils/                # Utility functions

prisma/               # Schema and migrations
```

## Database Schema

Key models:
- **User**: Clerk-synced users with claims
- **Claim**: Insurance claims with status, adjustor info, claimant details
- **Item**: Line items within claims (ordered, with attachments)
- **Attachment**: Files stored in R2 with metadata (thumbnailUrl, mimeType, size)

Claim statuses: `PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `CLOSED`

## Commands

```bash
# Development
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint + TypeScript check

# Database
pnpm prisma generate  # Generate Prisma client
pnpm prisma migrate dev --name <name>  # Create migration
pnpm prisma studio    # Database GUI
pnpm prisma db push   # Push schema without migration (dev only)

# Testing (when working on Neon staging)
# Create a Neon branch for testing before production migrations
```

## Code Conventions

### TypeScript
- Strict mode enabled - no `any` types
- All components have explicit Props interfaces at top of file
- Use `type` for object shapes, `interface` for extendable contracts

### Components
- Flat architecture: all components in `_barron-agency/components/`
- Self-contained: inline `cn()` utility if needed, no external coupling
- Presentational vs Smart: clearly separate data-fetching from rendering
- Props-driven: components receive data, don't fetch internally

### Styling
- Tailwind utilities with design tokens via CSS custom properties
- Theme configurations in `_barron-agency/styles/`
- No inline styles; use Tailwind classes exclusively

### API Routes
- Use Next.js Route Handlers (route.ts files)
- Server-side file uploads to R2 (bypass CORS)
- Return consistent JSON responses with proper status codes

### React Query Patterns
- Optimistic updates for all mutations
- Query keys follow: `['claims', claimId, 'items', itemId, 'attachments']`
- Use `useMutation` with `onMutate`, `onError`, `onSettled` for rollback

## File Storage (R2)

### Upload Flow
1. Client sends file via FormData to API route
2. API streams to R2: `uploadToR2(key, buffer, contentType)`
3. Key format: `claims/{claimId}/{itemId}/{timestamp}-{randomId}.{ext}`
4. Store metadata in Attachment model (publicId = R2 key)

### Download Flow
- API route proxies R2 files with proper Content-Disposition headers
- Use `/api/download?key={publicId}` endpoint

### Dual-Mode Support
- Legacy files: `publicId` may be Cloudinary ID
- New files: `publicId` is R2 key
- Check URL format to determine source

## Do Not

- Do not use Shadcn/UI or external component libraries
- Do not install new CSS frameworks (we use Tailwind only)
- Do not create components outside `_barron-agency/components/`
- Do not use `require()` - use ES modules only
- Do not commit `.env` files (use `.env.example` as template)

## Workflow Notes

- Use Neon database branches for testing migrations before production
- Vercel preview deployments auto-connect to staging database
- When adding new env vars, update both local `.env` and Vercel dashboard
- Files uploaded during development persist in R2 (clean up manually if needed)

## Key Decisions

1. **Server-side uploads**: Bypasses CORS, enables streaming, more secure
2. **R2 over Cloudinary**: 10x cheaper, S3-compatible, Cloudflare edge delivery
3. **Flat components**: Enables copy-paste portability between projects
4. **Optimistic updates**: Professional UX - no loading spinners for mutations
5. **Prisma over raw SQL**: Type safety, migrations, studio for debugging

## v1.1 Features

### PDF Generation
- **Components**: `ClaimPDF.tsx`, `DownloadClaimPDF.tsx`
- **API**: `GET /api/claims/[id]/pdf`
- **Dependencies**: `@react-pdf/renderer`, `sharp`
- **Pattern**: Server-side render, images converted to base64 JPEG

### Public Share Links
- **Component**: `ShareClaimButton.tsx`
- **Hooks**: `useShareLinks.ts` (useShareLink, useCreateShareLink, useRevokeShareLink)
- **API**: POST/GET/DELETE `/api/claims/[id]/share`, GET `/api/share/[token]`
- **Pattern**: Token-based (CUID), revokable, one per claim

### Route Groups
- `(app)/`: Authenticated routes with `AppLayout` (TopBar + Sidebar)
- `(public)/`: Public routes with minimal layout (TopBar only)
- **Benefit**: Layout separation without URL pollution

### Navigation System
- **AppLayout**: Main wrapper, orchestrates state, responsive
- **TopBar**: Fixed header with toggle, brand, and action slots
- **Sidebar**: Collapsible (desktop) / overlay (mobile)
- **State**: Desktop collapse persisted to localStorage

## Documentation References

- [PDFGeneration.md](../docs/guides/PDFGeneration.md) - PDF generation guide
- [PublicSharing.md](../docs/guides/PublicSharing.md) - Share link system
- [RouteGroups.md](../docs/guides/RouteGroups.md) - Route architecture
- [Navigation.md](../docs/guides/Navigation.md) - Navigation components
- [FileStorage.md](../docs/guides/FileStorage.md) - R2 storage (primary)
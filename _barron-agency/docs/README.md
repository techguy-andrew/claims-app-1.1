# Agency Foundation Template

A production-ready Next.js foundation built on a flat, portable component architecture. This template is our internal operational tooling—a library of self-contained, battle-tested components that enable consistent, high-quality delivery for every client project.

## Core Philosophy

**Build once, reuse everywhere.** This isn't a starter template you customize and discard. It's operational infrastructure where every component strengthens with each client project, enabling faster and more consistent delivery.

Every component in this template is:
- **Self-contained** - Inlined utilities, no external coupling
- **Explicitly typed** - Props interfaces enable IntelliSense and clarity
- **Token-based styling** - Design tokens enable instant client rebranding
- **Copy-paste portable** - Works immediately in new projects, zero modifications

## Why This Matters

Traditional agencies rebuild components for every client. We build once and compose infinitely. After five projects, we're significantly faster than starting from scratch. After fifty projects, we have a mature component library that enables consistent, reliable delivery across all client engagements.

This systematic approach to knowledge capture ensures quality and efficiency at scale.

## Tech Stack

- **Next.js 16** - Full-stack React framework with server components
- **TypeScript 5** - Type safety throughout the entire stack
- **Tailwind CSS v4** - Design tokens via CSS custom properties
- **Motion** - Smooth, professional animations (formerly Framer Motion)
- **React Query** - Optimistic updates and state management
- **Prisma** - Type-safe database ORM (schema included, client installs per-project)
- **Neon** - Serverless PostgreSQL database
- **Clerk** - User authentication and management
- **pnpm** - Fast, efficient package management
- **Vercel** - Zero-config deployment

### What We Don't Use

No Shadcn/UI. No Material-UI. No component library dependencies that change, deprecate, or break. We own the entire foundation.

## Quick Start

```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local

# Start development
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Component Library (34 Components)

### UI Primitives (7)
`Badge` `Button` `Card` `Dialog` `DropdownMenu` `Input` `Skeleton`

### Feature Components (17)
`ClaimDetailsCard` `ClaimForm` `ClaimListCard` `ClaimPDF` `ClaimStatusBadge` `ClaimStatusSelector` `DownloadClaimPDF` `FileGallery` `ItemCard` `ItemCardSkeleton` `ItemForm` `LoginForm` `PdfThumbnail` `PdfViewer` `SettingsForm` `ShareClaimButton` `Select`

### Layout/Navigation Components (9)
`AppLayout` `EmptyState` `Footer` `Header` `PageHeader` `PageSection` `Sidebar` `TopBar` `Toast`

### Utility (1)
`ConfirmationDialog`

### Icons (20)
`CancelIcon` `CheckIcon` `ChevronLeftIcon` `ChevronRightIcon` `CloseIcon` `DownloadIcon` `FileIcon` `FileTextIcon` `GripVerticalIcon` `HamburgerIcon` `HomeIcon` `LinkIcon` `LoadingIcon` `MenuIcon` `PlusIcon` `SaveIcon` `ShareIcon` `SpinnerIcon` `UploadIcon`

Every component is documented with props interfaces, npm dependencies, and whether it's "smart" (handles logic/data) or "presentational" (just renders). Open `app/components/` to see the complete library.

## Architecture Principles

### 1. Flat Component Structure

All components live in `app/components/` with PascalCase naming. No subfolders. No organization by "type" (ui/, forms/, layout/). This structure makes your entire interface visible at a glance.

```
app/components/
  ├── AppLayout.tsx
  ├── Badge.tsx
  ├── Button.tsx
  ├── Card.tsx
  ├── ClaimPDF.tsx
  ├── Dialog.tsx
  ├── FileGallery.tsx
  ├── ItemCard.tsx
  ├── ShareClaimButton.tsx
  ├── Sidebar.tsx
  ├── TopBar.tsx
  └── ... (23 more)
```

**Why flat?** Because when you start a new client project, you need to see what components exist immediately. Nested folders make you hunt. Flat structures make you productive.

### 2. Self-Contained Portability

Every component includes its own `cn()` class merging utility. No shared `/lib/utils` imports. No external helper dependencies. Copy the `.tsx` file to a new project and it works instantly.

**Portability test:** Can you copy just this file and have it work? If no, refactor it.

### 3. Design Token System

Components reference CSS custom properties through Tailwind utilities: `text-primary`, `bg-success`, `border-destructive`. Theme files in `app/styles/themes/` define these tokens with different values.

```
app/styles/themes/
  ├── default.css      # Base design system
  ├── client-a.css     # Client A branding
  ├── client-b.css     # Client B branding
  ├── christmas.css    # Seasonal variation
  └── halloween.css    # Seasonal variation
```

**Swap the theme file, rebrand the entire application.** Same components. Zero code changes. This is how you serve fifty clients with one codebase.

### 4. Explicit Props Interfaces

Every component defines its props at the top of the file. No implicit dependencies. No "figure it out from the code" documentation. Props interfaces are the documentation.

```typescript
interface PropertyCardProps {
  property: {
    id: string
    address: string
    rent: number
    imageUrl: string
  }
  onSelect?: (id: string) => void
  variant?: 'compact' | 'detailed'
}
```

This enables IntelliSense, prevents bugs, and makes components self-documenting.

### 5. Optimistic UI Updates

Every mutation feels instant. The UI updates immediately, syncs with the server in the background, and rolls back gracefully on errors. This isn't optional polish—it's our standard for professional software.

**The burden of proof is on the loading spinner, not the optimistic update.** Loading spinners say "the software is working." Optimistic updates say "it's done." The latter feels professional. The former feels amateur.

Implementation examples live in `lib/hooks/useItems.ts` and `lib/hooks/useAttachments.ts` showing the complete pattern with React Query.

### 6. Composition Over Configuration

Pages are pure compositions of components. No hardcoded UI elements. Think Lego blocks—import components, arrange them, done.

```typescript
export default function DashboardPage() {
  return (
    <PageLayout>
      <PageHeader title="Dashboard" />
      <StatsGrid stats={stats} />
      <ItemGrid items={items} />
    </PageLayout>
  )
}
```

When you need similar functionality in another project, copy the component files and compose them differently. Don't rebuild from scratch.

### 7. Purpose-Built Layout Components

We build semantic components that encode complete layout solutions rather than generic containers. PropertyCard, DataTable, FilterSidebar—each component knows how it should be laid out because that knowledge was refined across real client work. Modern CSS techniques (Grid, Container Queries) are implementation details, not exposed API surface.

**Further Reading:** [layout-architecture.md](./layout-architecture.md) provides comprehensive guidance on our layout and variant strategies.

## Project Structure

```
agency-foundation/
├── app/
│   ├── (app)/               # Authenticated routes (AppLayout)
│   │   ├── claims/          # Claims management
│   │   └── demo/            # Demo page
│   ├── (public)/            # Public routes (minimal layout)
│   │   └── share/[token]/   # Public claim sharing
│   ├── api/                 # API endpoints
│   │   ├── claims/          # Claims CRUD + items, attachments
│   │   ├── share/           # Public share endpoint
│   │   └── download/        # File download proxy
│   ├── components/          # All UI components (flat, 34 files)
│   ├── icons/               # Icon components (20 files)
│   └── styles/themes/       # Theme CSS files (5 variations)
├── context/                 # Documentation and checkpoints
│   ├── checkpoints/         # Compliance checkpoints and system
├── config/                  # Application configuration
├── lib/                     # Utilities, hooks, validation
│   └── hooks/               # React Query hooks (useClaims, useItems, useShareLinks)
├── types/                   # Shared TypeScript types
├── prisma/                  # Database schema and migrations
└── public/                  # Static assets
```

## Essential Commands

```bash
# Development
pnpm dev           # Start development server
pnpm build         # Build production bundle
pnpm start         # Run production build locally
pnpm lint          # Lint and type check

# Database (install Prisma client first)
pnpm prisma generate        # Generate Prisma client from schema
pnpm prisma migrate dev     # Run database migrations
pnpm prisma studio          # Open database GUI
```

## Component Portability Guide

To use any component in a new project:

1. **Copy the component file** - Single `.tsx` file from `app/components/`
2. **Install npm dependencies** - Check component file imports (typically `clsx` and `tailwind-merge`)
3. **Copy design tokens** - Relevant CSS variables from `app/styles/themes/default.css`
4. **Import and use** - Component works immediately, no refactoring needed

**Example:** Need a `PropertyCard` in a new project? Copy `PropertyCard.tsx`, install `clsx` and `tailwind-merge`, copy the `--color-*` tokens, done. The component works identically.

## Component Creation Checklist

Before committing any component, verify:

**Naming & Location**
- ☐ PascalCase naming (e.g., `PropertyCard.tsx`, `ApplicationForm.tsx`)
- ☐ Located directly in `/components` folder (flat structure, no subfolders)
- ☐ Component name matches filename exactly

**Self-Contained Structure**
- ☐ Props interface defined at the top of the file
- ☐ All required props explicitly typed
- ☐ Optional props have `?` modifier with sensible defaults
- ☐ Component receives data through props, never fetches internally
- ☐ No imports from `/lib/utils` - inline `cn()` function if needed
- ☐ Styling uses design tokens (e.g., `text-success` not `text-green-600`)

**Dependencies & Imports**
- ☐ Only imports from: `react`, `clsx`, `tailwind-merge`, npm packages, and `/types`
- ☐ No imports from other custom components unless necessary
- ☐ Shared TypeScript types imported from `/types` folder
- ☐ Component works if copied to new project with just its file + npm packages

**Portability Test**
- ☐ Ask: "Can I copy just this .tsx file to another project and have it work?"
- ☐ If no, refactor to remove external dependencies
- ☐ Component has clear single responsibility
- ☐ Styling is self-contained (no external CSS files required)

## Operational Efficiency

This template isn't just code. It's systematized operational infrastructure. Here's what improves with use:

**After Project 1:** You have 21 components and a working foundation.

**After Project 5:** You have 50+ components tested across multiple clients. Starting new projects takes days instead of weeks.

**After Project 20:** You have 100+ components spanning every common UI pattern. Your delivery velocity is significantly faster than starting from scratch.

**After Project 50:** Your component library enables consistent, reliable delivery across all engagements. You can reskin and redeploy with confidence.

This is why we own our foundation. This is why we don't use third-party component libraries. This systematic approach enables superior client delivery.

## Design Philosophy

**Own your foundation** - No dependency on external component libraries that can change, deprecate, or disappear.

**Build to last** - Use web standards (CSS variables, TypeScript, React) that will exist in 2030.

**Operational efficiency** - Every client project strengthens the component library, enabling faster and more reliable delivery.

**Client adaptability** - Theme system enables instant rebranding without touching component code.

**Professional feel** - Optimistic updates make every interaction feel instant, like desktop software.

## Starting a Client Project

1. **Fork this template** - Clone and rename for the client
2. **Browse components** - Open `app/components/` to see what's available
3. **Create client theme** - Add `client-name.css` to `app/styles/themes/`
4. **Compose pages** - Arrange existing components for client's needs
5. **Build new components** - Add to library when you need something new
6. **Backport improvements** - Copy enhanced components back to this template

Each client project improves the foundation, enabling faster and more consistent delivery over time.

## License

Internal use only.

---

## v1.1 Feature Highlights

### PDF Generation
Server-side PDF generation for claims using `@react-pdf/renderer`. Components: `ClaimPDF`, `DownloadClaimPDF`. See [PDFGeneration.md](./guides/PDFGeneration.md).

### Public Share Links
Token-based public access for claims. Components: `ShareClaimButton`. Hooks: `useShareLinks.ts`. See [PublicSharing.md](./guides/PublicSharing.md).

### Route Groups
Next.js route groups for layout separation: `(app)` for authenticated, `(public)` for shared views. See [RouteGroups.md](./guides/RouteGroups.md).

### Enhanced Navigation
Three-component navigation system: `AppLayout`, `TopBar`, `Sidebar` with responsive behavior and localStorage persistence. See [Navigation.md](./guides/Navigation.md).

---

**Version:** 1.1.0
**Last Updated:** December 2025
**Philosophy:** Own your foundation. Build to last.
# Tech Stack Reference Guide

Our philosophy: build durable, portable, customizable software that lasts. Own your foundation.

---

## Core Philosophy

We don't use external component libraries (Shadcn, Material-UI, etc.). Instead, we **build our own React component library** that serves as our competitive advantage. Every project we build makes this library better. Every client we serve makes it more adaptable. This approach ensures:

- **Full Ownership** - No dependency on third-party UI libraries that change, deprecate, or disappear
- **Portability** - Components can be restyled for any client without vendor lock-in
- **Longevity** - Our codebase will work 5, 10, 20 years from now with minimal changes
- **Customization** - We adapt to client needs, not client needs to us
- **Compound Growth** - Each project strengthens our reusable asset library

---

## Tech Stack

### Languages & Frameworks

- **TypeScript** - Type safety and clarity throughout the entire stack
- **JavaScript** - Runtime language of the web
- **Next.js 16** - Full-stack React framework (App Router, API routes, server components)
- **React** - UI library for building component-driven interfaces

### Styling & Animation

- **Tailwind CSS v4** - Utility-first CSS with design tokens via CSS custom properties
- **CSS Custom Properties** - Native browser variables for runtime theming and client adaptation
- **Motion** (formerly Framer Motion) - Smooth, professional animations and transitions
- **SVG Icons** - Downloaded and integrated directly into projects (no icon libraries)
- **Google Fonts** - Typography served via Next.js font optimization

### Backend & Database

- **Next.js API Routes** - Serverless backend with type-safe endpoints
- **Prisma** - Type-safe ORM for database operations
- **Neon** - Serverless PostgreSQL database with branching and instant provisioning
- **Cloudflare R2** - Primary file storage (S3-compatible, edge delivery)

### PDF & Document Generation

- **@react-pdf/renderer** - Server-side PDF generation with React components
- **sharp** - Image processing and format conversion (WebP/HEIC to JPEG for PDF embedding)

### State Management

- **React Query** - Server state management with optimistic updates and caching
- **React Context** - Client-side global state when needed
- **URL State** - Search params, filters, and navigation state

### Authentication

- **Clerk** - User authentication and management (industry standard, battle-tested, unlikely to disappear)

### Developer Tools

- **pnpm** - Fast, efficient package manager with better disk space usage
- **Vercel** - Zero-config deployment with preview environments
- **TypeScript Strict Mode** - Catch errors at compile time, not runtime

---

## Component Library Strategy

When building components, think reuse. Your Button, Card, Modal, Form inputs—they're not just for this project. They're for the next 50 projects. Build them:

- **Themeable** - Use CSS custom properties and Tailwind config so styling adapts to each client
- **Prop-driven** - Control behavior and appearance through props, not hardcoding
- **Self-contained** - Inline utilities, no external dependencies that break portability
- **Documented** - Props interfaces serve as documentation (clear, descriptive names)
- **Tested** - Reusable components must work reliably across projects

This library becomes your moat. Each project strengthens it. Each client validates it. After five years, you have a proprietary asset that competitors can't replicate.

> **Layout Patterns:** Our approach to building purpose-built layout components (PropertyGrid, FilterSidebar, DataTable) is detailed in [layout-architecture.md](./layout-architecture.md).

---

## Styling Strategy: Theming & Adaptability

The cornerstone of our reusability is how we handle styling. We use a **Tailwind + CSS Custom Properties** system that allows infinite client and context variations without touching component code.

### How It Works

Your `tailwind.config.ts` defines all design tokens as CSS variables: `--color-primary`, `--color-secondary`, `--spacing-xs`, etc. Components reference these tokens through Tailwind utilities (`bg-primary`, `text-success`). Separate theme CSS files (one per client, one per season/context) override these variables with different values. Load a different theme file, the entire app reskins instantly.

### Scenario One: Different Clients, Same Components

When you build a Banner or Sidebar component, it needs to work for Client A with their branding and Client B with theirs, without modifying the component code itself. 

**Implementation:**
1. Create separate CSS theme files for each client (`client-a.css`, `client-b.css`)
2. Each file sets different values for the same variables (`--color-primary`, `--spacing-sm`)
3. Components always reference tokens through Tailwind (`bg-primary`), never hardcoded colors
4. Load the appropriate theme file in `app/layout.tsx` based on environment variable or subdomain
5. The entire application reskins instantly—same components, zero code changes

**Result:** You write the component once, swap the CSS file, and the app transforms for the new client with zero component modifications.

### Scenario Two: Same Component, Different Contexts

A Banner component should look different at Christmas than Halloween. A Sidebar might have different styling for different app sections.

**Implementation:**
1. Create multiple theme CSS files (`christmas.css`, `halloween.css`, `landing.css`, `dashboard.css`)
2. Each file overrides the same variables with different values
3. At runtime, your app loads whichever theme applies (based on date, user preference, route, or environment variable)
4. The component itself never changes—it just reads whatever variables are currently defined

**Result:** Unlimited styling variations from a single component. Themes swap instantly. System stays maintainable because the source of truth is always the CSS variables.

### Why This Approach Wins

This method—Tailwind config as tokens plus CSS custom properties for theming—is the industry standard used by Vercel, Stripe, and professional SaaS companies. 

**Durability:** CSS variables are native browser standards that will exist in 20 years. Tailwind will outlast any component library. You're building on the bedrock of web standards, not framework trends.

**Flexibility:** You can swap themes at build time (deploy different CSS per client) or runtime (same app, user picks theme). It scales from two clients to two hundred without architectural changes.

**Longevity:** This is the only approach that actually lasts. Component libraries deprecate. Framework-specific patterns break. Web standards endure.

### File Structure

```
app/
  components/
    Banner.tsx
    Sidebar.tsx
    Button.tsx
    Card.tsx
    PropertyCard.tsx
    ItemForm.tsx
    // your entire component library, flat and visible
  icons/
    CancelIcon.tsx
    LoadingIcon.tsx
    MenuIcon.tsx
    // icon components separate from UI components
  styles/
    globals.css
    themes/
      default.css
      client-a.css
      client-b.css
      christmas.css
      halloween.css
      landing.css
      dashboard.css
  layout.tsx  // loads appropriate theme
```

> **Further Reading:** See [layout-architecture.md](./layout-architecture.md) for detailed implementation patterns, semantic component examples, and responsive layout strategies.

---

## Interaction Strategy: Optimistic Updates

The cornerstone of our user experience is how we handle mutations. We use an **optimistic update pattern** where the UI responds instantly and syncs with the server in the background.

### The Philosophy

Modern users don't wait. They've been trained by native mobile apps, desktop software, and premium SaaS products to expect immediate feedback. When they click "Save," something must happen *now*—not after a loading spinner, not after a network round-trip, not after a "please wait" message.

**The old way (traditional web forms):**
1. User clicks "Save"
2. Button shows loading spinner
3. Network request takes 200-2000ms
4. UI updates after server responds
5. User waits, uncertainty builds

**Our way (optimistic updates):**
1. User clicks "Save"
2. UI updates instantly (0ms perceived latency)
3. Network request happens in background
4. If it fails, rollback and notify user
5. User feels in control, app feels fast

This isn't about shaving milliseconds off performance metrics. It's about **perceived quality**. Users judge software by how it *feels*, not by how it performs on benchmarks. An app that responds instantly feels professional, polished, trustworthy. An app that shows spinners feels slow, uncertain, amateur.

**Our standard:** Every mutation should feel instant unless there's a specific justification for displaying a loading state. The burden of proof is on the loading spinner, not on the optimistic update.

### How It Works

1. User performs action (click save, drag item, upload file)
2. UI updates immediately with expected result
3. Network request happens in background
4. On success: reconcile with server response
5. On error: rollback to previous state, notify user

### Implementation with React Query

We use TanStack Query mutations with the `onMutate`, `onError`, and `onSuccess` callbacks:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Item } from '@/types'

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    // The actual API call
    mutationFn: async (data: CreateItemData) => {
      const response = await fetch('/api/items', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return response.json()
    },

    // STEP 1: Optimistic update (runs immediately)
    onMutate: async (data) => {
      // Cancel in-flight queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['items'] })

      // Snapshot current state for potential rollback
      const previousItems = queryClient.getQueryData<Item[]>(['items'])

      // Create temporary item with temp ID
      const tempItem: Item = {
        id: `temp-${Date.now()}`,
        ...data,
        order: 0,
        attachments: [],
      }

      // Update cache immediately - UI reflects this instantly
      queryClient.setQueryData<Item[]>(['items'], (old = []) =>
        [tempItem, ...old]
      )

      // Return context for rollback
      return { previousItems, tempItem }
    },

    // STEP 2: Handle errors (rollback)
    onError: (err, variables, context) => {
      // Restore previous state
      if (context?.previousItems) {
        queryClient.setQueryData(['items'], context.previousItems)
      }

      // Notify user
      toast.error('Failed to create item. Please try again.')
    },

    // STEP 3: Handle success (replace temp with real)
    onSuccess: (newItem, variables, context) => {
      // Replace temp item with real item from server
      queryClient.setQueryData<Item[]>(['items'], (old = []) =>
        old.map(item =>
          item.id === context?.tempItem.id ? newItem : item
        )
      )

      toast.success('Item created')
    },
  })
}
```

### The Flow

```
User Action → onMutate (instant UI update) → mutationFn (background API call)
                                                    ↓
                                          onSuccess (reconcile)
                                                 OR
                                          onError (rollback + notify)
```

### Key Principles

1. **Cancel outgoing queries** - Prevents race conditions where stale data overwrites optimistic update
2. **Snapshot previous state** - Always capture current state before modifying for rollback capability
3. **Use temporary IDs** - Distinguish optimistic items from server-confirmed items (e.g., `temp-${Date.now()}`)
4. **Return context** - Pass rollback data through the mutation lifecycle
5. **Replace, don't refetch** - Update specific items in cache rather than refetching entire list (faster, less bandwidth)

### Where It's Used

**Hooks (`lib/hooks/useItems.ts`)** - 5 mutations:
- `useCreateItem()` - Add new items with temp ID
- `useUpdateItem()` - Modify title/description instantly
- `useDeleteItem()` - Remove from list immediately
- `useDuplicateItem()` - Clone with optimistic copy
- `useReorderItems()` - Reorder list instantly on drag-drop

**Hooks (`lib/hooks/useAttachments.ts`)** - 2 mutations:
- `useAddAttachments()` - Show files immediately with upload progress
- `useRemoveAttachment()` - Remove from gallery instantly

**Components (`app/components/ItemCard.tsx`)** - UI reflects optimistic state:
- Shows `isSaving` indicator during background persistence
- Displays temp attachments with upload progress
- Handles edit/cancel with state restoration

### When to Use It

**Always use optimistic updates for:**
- CRUD operations (create, update, delete)
- Reordering and drag-drop
- File uploads (with progress indicators)
- User preferences and settings
- Duplicating and cloning

**Don't use optimistic updates for:**
- Payment processing (users need confirmation before money moves)
- Irreversible destructive actions (deleting accounts, purging data)
- Operations requiring external confirmation
- Multi-step workflows with dependencies

**The rule:** Default to optimistic. Justify loading states. If you're reaching for a loading spinner, ask: "Why can't this be optimistic?" If you don't have a good answer, make it optimistic.

### Rollback Strategy

When optimistic updates fail, gracefully restore previous state and inform the user:

```typescript
onMutate: async (data) => {
  // 1. SNAPSHOT - Capture current state
  const previousItems = queryClient.getQueryData<Item[]>(['items'])

  // 2. OPTIMISTIC UPDATE - Apply expected changes
  queryClient.setQueryData<Item[]>(['items'], (old = []) =>
    old.filter(item => item.id !== data.id)
  )

  // 3. RETURN CONTEXT - Pass snapshot for rollback
  return { previousItems }
},

onError: (err, variables, context) => {
  // ROLLBACK - Restore exact previous state
  if (context?.previousItems) {
    queryClient.setQueryData(['items'], context.previousItems)
  }

  // NOTIFY - Tell user what happened
  toast.error('Failed to delete. Item has been restored.')
},
```

**User Communication:**
- Success: "Item saved" (brief, confirming)
- Error: "Failed to save. Changes reverted." (explains what happened)
- Retry: "Connection lost. Retrying..." (shows we're handling it)

**Visual Indicators:**
- Subtle "saving" indicator during background sync
- Red highlight or shake animation on error
- Smooth restore animation when rolling back

### Why This Approach Wins

Loading spinners tell users "the software is working." Optimistic updates tell users "it's done." The latter feels professional, instant, trustworthy. The former feels slow, uncertain, amateur.

This is the difference between web forms from 2010 and modern desktop-class applications. We build the latter.

---

## What We Don't Use

No Shadcn/UI, no Material-UI, no dependency sprawl. We build what we need. We own what we build.

---

## Essay: On Ownership, Portability, and Building to Last

### The Cost of Convenience

For decades, developers chose convenience over control. We adopted jQuery, then Bootstrap, then Material-UI, then Shadcn/UI—each time believing we were accelerating. Each time, we were surrendering. We outsourced our design system to someone else's vision, updated when they decided to update, deprecated features when they decided they were no longer important, and watched helplessly as APIs changed and components broke.

The reality of this approach became clear only years later: the convenience was front-loaded. We saved time on day one and paid interest forever.

### Why Agencies Must Own Everything

An agency is not a feature factory. You're not building one product for one market. You're building a **platform of reusable assets** that compound across dozens of clients, hundreds of projects, years of work. Every component you write should work for the next client without modification. Every styling decision should adapt to any brand without breaking. Every line of code should be portable enough to outlive the frameworks that surround it.

This is only possible if you own the entire stack, top to bottom. Not own in the legal sense—own in the sense that you understand it, control it, and can change it without waiting for a maintainer or a pull request to be merged. You cannot build a durable agency on borrowed code.

The component library you build becomes your intellectual property, your competitive advantage, and your leverage. Each project makes it stronger. Each client makes it more flexible. After five years, you have something worth far more than the sum of individual projects—you have a system that lets you build applications 10x faster than competitors who keep starting from zero.

### Theming as a Core Principle

Theming is not an afterthought. It's the proof that your components are truly reusable. If reskinning a component for a new client requires even a small code change, you've failed. The component isn't reusable; it's just a template.

CSS custom properties (variables) solved this problem permanently. They're native browser standards, supported everywhere, and they allow you to define a complete design system once and override it infinitely many times. Client A gets one set of colors and spacing. Client B gets another. Halloween gets pumpkins and orange. Christmas gets red and green. Same components, different themes, zero code changes.

This isn't clever engineering. It's just using the browser the way it was designed to be used.

### The Portability Principle

Software should be portable. Not just between devices or browsers, but between clients, between contexts, between eras. A component built today should work in 2030 with minimal changes—ideally zero changes.

This is only possible if you avoid dependencies that will disappear. Framework-specific libraries will disappear. Third-party component libraries will deprecate. Vendor-specific patterns will break. But TypeScript, React, Next.js, Tailwind, and CSS will not. They're bedrock. They're standards. They're what the web is built on.

Build on bedrock, and your buildings last. Build on sand, and you rebuild constantly.

### The True Cost of Third-Party UI Libraries

Shadcn/UI, Material-UI, Chakra—they're not bad tools. They're just borrowed solutions. When you use them, you inherit their design decisions, their API design, their philosophy of what a button should be. This works fine when building one product. It becomes a liability when building fifty.

For every hour you save using a pre-built component library on day one, you spend two hours fighting it, customizing it, or replacing it by year three. And when you finally replace it, you have to replace it across every project simultaneously or maintain multiple design systems in parallel.

An agency that builds its own components pays a cost upfront. Six months in, that cost is paid back. A year in, you're years ahead. Five years in, you've compounded a system that a competitor using third-party libraries can't touch.

### The Agency Advantage

This is what separates real agencies from feature factories. Real agencies own their tools. They've built a system that gets better with each project. They can reskin an application for a new client in days instead of weeks. They can adapt to new requirements without rearchitecting. They can hand off a project to a junior developer knowing their component library is a guardrail, not a limitation.

This is what your component library is. It's not just code. It's leverage.

### The Long View

Build as if you're building infrastructure. Ask: will this exist in 2030? Will my junior developers understand this in 2026? Can I reskin this for the next client without touching it? If the answer is no to any of these, redesign it now.

The technologies you choose should be the ones that will be here forever. TypeScript will be here. React will be here. Tailwind will be here. CSS custom properties will definitely be here. Build on these, and you build on a foundation that doesn't require constant maintenance, constant updates, constant sacrifices to keep up with hype.

This is the agency advantage. Own it.

---

## File Structure Schema - Implement Exactly As Shown

```
project-name/
├── app/
│   ├── (app)/                     # Authenticated routes (AppLayout)
│   │   ├── layout.tsx             # Uses AppLayout wrapper
│   │   ├── page.tsx               # Home page
│   │   ├── claims/
│   │   │   ├── page.tsx           # Claims list
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Claim detail
│   │   └── demo/
│   │       └── page.tsx           # Demo page
│   ├── (public)/                  # Public routes (minimal layout)
│   │   ├── layout.tsx             # TopBar only, no sidebar
│   │   └── share/
│   │       └── [token]/
│   │           └── page.tsx       # Public claim view
│   ├── api/
│   │   ├── claims/
│   │   │   ├── route.ts           # GET all, POST new
│   │   │   └── [id]/
│   │   │       ├── route.ts       # GET/PATCH/DELETE claim
│   │   │       ├── items/         # Item CRUD
│   │   │       ├── share/         # Share link management
│   │   │       │   └── route.ts   # POST/GET/DELETE share
│   │   │       └── pdf/
│   │   │           └── route.ts   # GET PDF generation
│   │   ├── share/
│   │   │   └── [token]/
│   │   │       └── route.ts       # Public claim by token
│   │   ├── download/
│   │   │   └── route.ts           # File download proxy
│   │   └── webhook/
│   │       └── clerk/
│   │           └── route.ts
│   ├── components/                # 34 UI components
│   │   ├── AppLayout.tsx          # Main layout wrapper
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── ClaimDetailsCard.tsx
│   │   ├── ClaimForm.tsx
│   │   ├── ClaimListCard.tsx
│   │   ├── ClaimPDF.tsx           # PDF document template
│   │   ├── ClaimStatusBadge.tsx
│   │   ├── ClaimStatusSelector.tsx
│   │   ├── ConfirmationDialog.tsx
│   │   ├── Dialog.tsx
│   │   ├── DownloadClaimPDF.tsx   # PDF download button
│   │   ├── DropdownMenu.tsx
│   │   ├── EmptyState.tsx
│   │   ├── FileGallery.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── Input.tsx
│   │   ├── ItemCard.tsx
│   │   ├── ItemCardSkeleton.tsx
│   │   ├── ItemForm.tsx
│   │   ├── LoginForm.tsx
│   │   ├── PageHeader.tsx
│   │   ├── PageSection.tsx
│   │   ├── PdfThumbnail.tsx
│   │   ├── PdfViewer.tsx
│   │   ├── Select.tsx
│   │   ├── SettingsForm.tsx
│   │   ├── ShareClaimButton.tsx   # Share link management
│   │   ├── Sidebar.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx
│   │   └── TopBar.tsx             # Fixed header
│   ├── icons/                     # 20 icon components
│   │   ├── CancelIcon.tsx
│   │   ├── CheckIcon.tsx
│   │   ├── ChevronLeftIcon.tsx
│   │   ├── ChevronRightIcon.tsx
│   │   ├── CloseIcon.tsx
│   │   ├── DownloadIcon.tsx
│   │   ├── FileIcon.tsx
│   │   ├── FileTextIcon.tsx
│   │   ├── GripVerticalIcon.tsx
│   │   ├── HamburgerIcon.tsx
│   │   ├── HomeIcon.tsx
│   │   ├── LinkIcon.tsx
│   │   ├── LoadingIcon.tsx
│   │   ├── MenuIcon.tsx
│   │   ├── PlusIcon.tsx
│   │   ├── SaveIcon.tsx
│   │   ├── ShareIcon.tsx
│   │   ├── SpinnerIcon.tsx
│   │   └── UploadIcon.tsx
│   ├── styles/
│   │   ├── globals.css
│   │   └── themes/
│   │       ├── default.css
│   │       ├── client-a.css
│   │       ├── client-b.css
│   │       ├── christmas.css
│   │       └── halloween.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── error.tsx
├── context/
│   ├── checkpoints/
│   │   ├── checkpoint-system.md
│   │   └── checkpoint-N.md
│   ├── README.md
│   ├── philosophy.md
│   ├── tech-stack.md
│   └── layout-architecture.md
├── lib/
│   ├── prisma.ts
│   ├── r2.ts                      # Cloudflare R2 client
│   ├── cloudinary.ts              # Legacy Cloudinary support
│   ├── auth.ts
│   ├── utils.ts
│   ├── constants.ts
│   ├── validations.ts
│   └── hooks/
│       ├── useClaims.ts
│       ├── useItems.ts
│       ├── useAttachments.ts
│       └── useShareLinks.ts       # Share link mutations
├── types/
│   ├── index.ts
│   ├── items.ts
│   ├── users.ts
│   └── api.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   ├── icons/
│   ├── images/
│   └── fonts/
├── config/
│   ├── site.ts
│   └── env.ts
├── middleware.ts
├── .env.example
├── .env.local (gitignored)
├── .gitignore
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── package.json
├── pnpm-lock.yaml
└── CHANGELOG.md
```

---

## Component Architecture Philosophy

Our agency builds applications using a flat component architecture where every UI element lives in a single `/components` folder as a self-contained `.tsx` file with PascalCase naming. This structure makes your entire application's interface visible at a glance and enables true portability—you can copy any component file from one project to another and it works immediately. Think of this as building an ever-growing library of battle-tested components where each client project strengthens your agency's asset base. The goal is drag-and-drop reusability across all projects with minimal to zero modifications needed.

Every component must be self-contained with an explicit props interface defined at the top of the file. Components receive all data through props rather than fetching it internally—for example, a PropertyCard gets a property object passed to it instead of calling database hooks. All styling lives within the component using Tailwind classes that reference design tokens from your `tailwind.config.ts` for consistency. Shared TypeScript types belong in a separate `/types` folder so multiple components can reference the same data structures without tight coupling. If a component needs the `cn()` utility for class merging, inline it directly in the component file rather than importing from a shared lib folder.

Pages should be pure compositions of components with zero hardcoded UI elements—think of arranging Lego blocks where the page file just imports components and arranges them. A dashboard page imports PageLayout, PageHeader, StatsGrid, and DataTable components, then composes them together without writing any direct HTML or styling. This composition-over-configuration approach ensures you're always building reusable pieces rather than one-off page code. When you need similar functionality in another project, you copy the component files and compose them differently for that client's needs.

Before committing any new component, ask yourself: "Could I copy this single file into a fresh project and have it work with minimal changes?" If the answer is no, the component has external dependencies that break portability. Maintain a clear mental separation between smart components that handle data fetching and business logic versus presentational components that just render what they receive—both live in `/components` but presentational ones are your most portable and reusable assets. This philosophy transforms every project into an opportunity to build components that make the next project faster, creating a compounding competitive advantage for your agency.

---

## Component Creation & Editing Checklist

Before committing any component to `/components`, verify:

### Naming & Location
☐ File uses PascalCase naming (e.g., `PropertyCard.tsx`, `ApplicationForm.tsx`)  
☐ File is located directly in `/components` folder (flat structure, no subfolders)  
☐ Component name matches filename exactly  

### Self-Contained Structure
☐ Props interface is defined at the top of the file  
☐ All required props are explicitly typed  
☐ Optional props have `?` modifier and sensible defaults where needed  
☐ Component receives data through props, never fetches data internally  
☐ No imports from `/lib/utils` - inline the `cn()` function if needed  
☐ All styling uses Tailwind classes with design tokens (e.g., `text-success` not `text-green-600`)  

### Dependencies & Imports
☐ Only imports from: `react`, `clsx`, `tailwind-merge`, npm packages (radix-ui, etc.), and `/types`  
☐ No imports from other custom components unless absolutely necessary  
☐ Shared TypeScript types are imported from `/types` folder, not defined in component  
☐ Component works if copied to a new project with just its file + npm packages  

### Portability Test
☐ Ask: "Can I copy just this .tsx file to another project and have it work?"  
☐ If no, refactor to remove external dependencies  
☐ Component has clear single responsibility (does one thing well)  
☐ Styling is self-contained (no external CSS files required)  

### Documentation
☐ Props interface serves as documentation (clear, descriptive names)  
☐ Note if component is "smart" (handles logic/data) or "presentational" (just renders)  

---

---

## PDF Generation Strategy

Server-side PDF generation using `@react-pdf/renderer` for professional claim documents:

### Architecture
- **ClaimPDF.tsx**: React-PDF document template with styled components
- **DownloadClaimPDF.tsx**: Client button that triggers download
- **API Route**: `/api/claims/[id]/pdf` generates and streams PDF

### Image Handling
Images are converted to base64 JPEG for PDF embedding using `sharp`:
- Converts WebP, HEIC, PNG to JPEG format
- 15-second timeout per image with graceful fallback
- Design tokens converted to hex colors for PDF styling

### Integration
- PDF auto-creates share link if none exists
- Share URL embedded in PDF header and footer
- See [PDFGeneration.md](./guides/PDFGeneration.md) for complete guide

---

## Public Access Pattern

Token-based public sharing for claims without authentication:

### Database Model
```prisma
model ShareLink {
  id        String   @id @default(cuid())
  token     String   @unique @default(cuid())
  claimId   String   @unique
  claim     Claim    @relation(...)
  createdAt DateTime @default(now())
}
```

### Route Groups
- `(app)/`: Authenticated routes wrapped in AppLayout
- `(public)/`: Public routes with minimal layout (TopBar only)

### Security
- CUID tokens (not guessable, not sequential)
- One link per claim, revokable
- Cascade delete when claim deleted
- Read-only public view

See [PublicSharing.md](./guides/PublicSharing.md) and [RouteGroups.md](./guides/RouteGroups.md) for complete guides.

---

**Version:** 5.2
**Last Updated:** December 2025
**Philosophy:** Own your foundation. Build to last.
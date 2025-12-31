# Route Groups Architecture

Next.js route groups for separating authenticated and public layouts without affecting URL structure.

## Overview

Route groups (folders wrapped in parentheses) allow different layouts for different sections of the app while keeping URLs clean. The claims app uses two route groups:

- **`(app)`** - Authenticated routes with full navigation (sidebar, topbar)
- **`(public)`** - Public routes with minimal UI (topbar only)

## Directory Structure

```
app/
├── (app)/                      # Authenticated route group
│   ├── layout.tsx              # Uses AppLayout (TopBar + Sidebar)
│   ├── page.tsx                # Home page (/)
│   ├── claims/
│   │   ├── page.tsx            # Claims list (/claims)
│   │   └── [id]/
│   │       └── page.tsx        # Claim detail (/claims/[id])
│   └── demo/
│       └── page.tsx            # Demo page (/demo)
│
├── (public)/                   # Public route group
│   ├── layout.tsx              # Minimal wrapper (TopBar only)
│   └── share/
│       └── [token]/
│           └── page.tsx        # Public claim view (/share/[token])
│
├── api/                        # API routes (no layout)
│   ├── claims/
│   ├── share/
│   └── download/
│
└── layout.tsx                  # Root layout (providers, fonts, etc.)
```

## URL Mapping

Route groups don't affect URLs - the parentheses are stripped:

| File Path | URL |
|-----------|-----|
| `app/(app)/page.tsx` | `/` |
| `app/(app)/claims/page.tsx` | `/claims` |
| `app/(app)/claims/[id]/page.tsx` | `/claims/abc123` |
| `app/(app)/demo/page.tsx` | `/demo` |
| `app/(public)/share/[token]/page.tsx` | `/share/xyz789` |

## (app) Route Group

### Purpose
Contains all authenticated routes that require the full application layout with navigation.

### Layout (`app/(app)/layout.tsx`)

```tsx
import { AppLayout } from '@/_barron-agency/components/AppLayout'

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayout>{children}</AppLayout>
}
```

### Features
- Full navigation with collapsible sidebar
- TopBar with branding and actions
- Consistent authenticated experience
- All CRUD operations available

### Routes
| Route | Purpose |
|-------|---------|
| `/` | Home/dashboard |
| `/claims` | Claims list with create functionality |
| `/claims/[id]` | Claim detail with items, editing, sharing |
| `/demo` | Component demonstration page |

## (public) Route Group

### Purpose
Contains publicly accessible routes that don't require authentication.

### Layout (`app/(public)/layout.tsx`)

```tsx
import { TopBar } from '@/_barron-agency/components/TopBar'

export default function PublicGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="pt-16">{children}</main>
    </div>
  )
}
```

### Features
- Minimal navigation (TopBar only, no sidebar)
- Read-only data display
- Token-based access (no authentication)
- Professional presentation for external viewers

### Routes
| Route | Purpose |
|-------|---------|
| `/share/[token]` | Public read-only claim view |

## Benefits

### 1. Layout Separation
Different user experiences for different contexts without code duplication or conditional rendering.

### 2. Clean URLs
Route groups are invisible in URLs - users see `/claims`, not `/(app)/claims`.

### 3. Security Boundaries
Clear distinction between authenticated and public routes at the file system level.

### 4. Shared Components
Both groups can use components from `_barron-agency/components/` - only the layout wrapper differs.

### 5. Independent Layouts
Changes to authenticated layout don't affect public layout and vice versa.

## Implementation Pattern

### Root Layout (Shared)

`app/layout.tsx` contains providers and global configuration:

```tsx
import { Providers } from './_barron-agency/providers/providers'
import '@/_barron-agency/styles/globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Group Layouts (Specific)

Each group layout wraps only its routes:

```
Root Layout (providers, styles)
    ├── (app) Layout (AppLayout)
    │   └── App pages
    └── (public) Layout (minimal)
        └── Public pages
```

## Adding New Routes

### To (app) Group
1. Create folder/page in `app/(app)/`
2. Page automatically gets AppLayout
3. Add to sidebar navigation config if needed

### To (public) Group
1. Create folder/page in `app/(public)/`
2. Page gets minimal layout
3. No authentication required

### Example: Adding Settings Page

```
app/(app)/settings/
└── page.tsx
```

```tsx
// app/(app)/settings/page.tsx
export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1>Settings</h1>
      {/* Settings content */}
    </div>
  )
}
```

URL: `/settings` (automatically wrapped in AppLayout)

## API Routes

API routes (`app/api/`) are **not** in any route group:
- No layout applied
- Direct request/response
- Can be called from both authenticated and public pages

```
app/api/
├── claims/                     # Claim CRUD (authenticated)
│   ├── route.ts                # GET all, POST new
│   └── [id]/
│       ├── route.ts            # GET/PATCH/DELETE claim
│       ├── items/              # Item management
│       ├── share/              # Share link management
│       └── pdf/                # PDF generation
└── share/                      # Public endpoint
    └── [token]/
        └── route.ts            # GET claim by token (no auth)
```

## Best Practices

1. **Keep layouts minimal** - Group layouts should only add the wrapper, not business logic

2. **Use root layout for providers** - React Query, theme providers, etc. go in root layout

3. **Don't nest route groups** - Keep the structure flat for clarity

4. **Document new groups** - If you add a third group, document its purpose

5. **Consider authentication** - (app) routes should eventually have auth middleware

---

**Version:** 1.1.0
**Last Updated:** December 2025

# Navigation System Guide

A responsive three-component navigation system with persistent state and mobile-first design.

## Overview

The navigation system consists of three components that work together:

| Component | Purpose |
|-----------|---------|
| `AppLayout` | Main layout wrapper, orchestrates state |
| `TopBar` | Fixed header with brand, toggle, and action slots |
| `Sidebar` | Collapsible navigation with route links |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         TopBar                               │
│  [Toggle] [Brand]        [Center Slot]        [Actions Slot] │
├─────────────────────────────────────────────────────────────┤
│          │                                                   │
│ Sidebar  │                  Main Content                     │
│          │                                                   │
│  [Nav]   │              (children prop)                      │
│  [Items] │                                                   │
│          │                                                   │
└──────────┴───────────────────────────────────────────────────┘
```

## AppLayout Component

### Location
`_barron-agency/components/AppLayout.tsx`

### Purpose
Wraps authenticated pages with navigation, managing responsive behavior and state persistence.

### Props

```typescript
interface AppLayoutProps {
  /** Page content */
  children: React.ReactNode
  /** Content for TopBar center slot */
  topBarCenter?: React.ReactNode
  /** Content for TopBar right actions slot */
  actions?: React.ReactNode
}
```

### Usage

```tsx
import { AppLayout } from '@/_barron-agency/components/AppLayout'

// In (app) group layout
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayout>{children}</AppLayout>
}

// With optional slots
export default function AppGroupLayout({ children }) {
  return (
    <AppLayout
      topBarCenter={<SearchBar />}
      actions={<UserMenu />}
    >
      {children}
    </AppLayout>
  )
}
```

### Features

**Desktop Behavior:**
- Sidebar toggles between expanded (256px) and collapsed (64px) states
- Collapsed state persisted to localStorage
- Sidebar stays visible, just narrower

**Mobile Behavior (< 768px):**
- Sidebar hidden by default
- Opens as overlay with backdrop
- Closes on navigation or backdrop click
- Not persisted (always starts hidden)

### Custom Hooks (Internal)

```typescript
// Persist state to localStorage
function useLocalStorageState<T>(key: string, defaultValue: T)

// Detect mobile viewport
function useIsMobile(breakpoint: number = 768)
```

## TopBar Component

### Location
`_barron-agency/components/TopBar.tsx`

### Purpose
Fixed header providing brand link, sidebar toggle, and slot-based content areas.

### Props

```typescript
interface TopBarProps {
  /** Callback when sidebar toggle is clicked */
  onSidebarToggle?: () => void
  /** Current sidebar collapsed state (for toggle icon direction) */
  sidebarCollapsed?: boolean
  /** Content for right actions area */
  actions?: React.ReactNode
  /** Content for center area */
  children?: React.ReactNode
}
```

### Structure

```tsx
<header className="fixed top-0 left-0 right-0 h-16 z-50 border-b bg-background">
  {/* Left: Toggle + Brand */}
  <div className="flex items-center gap-4">
    <button onClick={onSidebarToggle}>
      <ChevronLeftIcon /> {/* Rotates based on collapsed state */}
    </button>
    <Link href="/">
      <FileTextIcon />
      <span>Seamless Restoration</span>
    </Link>
  </div>

  {/* Center: Slot for search, breadcrumbs, etc. */}
  <div className="flex-1 flex justify-center">
    {children}
  </div>

  {/* Right: Actions slot */}
  <div className="flex items-center gap-4">
    {actions}
  </div>
</header>
```

### Toggle Animation

The chevron icon animates based on sidebar state:

```tsx
<ChevronLeftIcon
  className={cn(
    "h-5 w-5 transition-transform duration-200",
    sidebarCollapsed && "rotate-180"
  )}
/>
```

## Sidebar Component

### Location
`_barron-agency/components/Sidebar.tsx`

### Purpose
Navigation sidebar with responsive collapse behavior and animated transitions.

### Props

```typescript
interface SidebarProps {
  /** Whether sidebar is collapsed (desktop only) */
  collapsed?: boolean
  /** Whether sidebar is hidden (used internally) */
  hidden?: boolean
  /** Whether in mobile mode */
  isMobile?: boolean
  /** Callback when a link is clicked (for closing mobile sidebar) */
  onLinkClick?: () => void
  /** Additional class names */
  className?: string
}
```

### Navigation Configuration

Navigation items defined in `_barron-agency/config/navigation.ts`:

```typescript
export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

export const navigationItems: NavItem[] = [
  { label: 'Home', href: '/', icon: HomeIcon },
  { label: 'Claims', href: '/claims', icon: FileTextIcon },
  // Add more items...
]
```

### Desktop Behavior

```tsx
// Width transition on collapse
<aside
  className={cn(
    "border-r bg-background transition-all duration-200",
    collapsed ? "w-16" : "w-64"
  )}
>
  {/* Navigation items show icons only when collapsed */}
  {navigationItems.map((item) => (
    <Link href={item.href}>
      <item.icon className="h-5 w-5" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  ))}
</aside>
```

### Mobile Behavior

```tsx
// Overlay sidebar with slide animation
{isMobile && (
  <motion.aside
    initial={{ x: -256 }}
    animate={{ x: 0 }}
    exit={{ x: -256 }}
    className="fixed left-0 top-16 bottom-0 w-64 z-50"
  >
    {/* Full navigation, closes on click */}
  </motion.aside>
)}
```

## State Management

### Desktop State (Persisted)

```typescript
// Stored in localStorage as 'sidebar-collapsed'
const [desktopCollapsed, setDesktopCollapsed] = useLocalStorageState(
  'sidebar-collapsed',
  false
)
```

User preference persists across sessions.

### Mobile State (Session Only)

```typescript
// Not persisted, always starts hidden
const [mobileHidden, setMobileHidden] = React.useState(true)
```

Mobile sidebar always starts closed for better UX.

### Toggle Logic

```typescript
const handleSidebarToggle = () => {
  if (isMobile) {
    setMobileHidden((prev) => !prev)  // Toggle visibility
  } else {
    setDesktopCollapsed((prev) => !prev)  // Toggle width
  }
}
```

## Responsive Breakpoints

| Viewport | Sidebar Mode | Behavior |
|----------|--------------|----------|
| < 768px | Mobile | Overlay, hidden by default |
| >= 768px | Desktop | Inline, collapsible |

## Styling Patterns

### Design Tokens

All navigation components use design tokens:

```css
/* Background and borders */
bg-background
border-border

/* Interactive states */
hover:bg-accent
text-foreground
text-muted-foreground

/* Active link */
bg-accent
text-accent-foreground
```

### Z-Index Layers

```
TopBar: z-50
Mobile Backdrop: z-40
Mobile Sidebar: z-50
```

## Adding Navigation Items

### 1. Create Icon (if needed)

```tsx
// _barron-agency/icons/SettingsIcon.tsx
export function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      {/* SVG path */}
    </svg>
  )
}
```

### 2. Update Navigation Config

```typescript
// _barron-agency/config/navigation.ts
import { SettingsIcon } from '../icons/SettingsIcon'

export const navigationItems: NavItem[] = [
  { label: 'Home', href: '/', icon: HomeIcon },
  { label: 'Claims', href: '/claims', icon: FileTextIcon },
  { label: 'Settings', href: '/settings', icon: SettingsIcon }, // New
]
```

### 3. Create Route

```tsx
// app/(app)/settings/page.tsx
export default function SettingsPage() {
  return <div>Settings Content</div>
}
```

## Accessibility

- **Keyboard navigation:** All interactive elements are focusable
- **ARIA labels:** Toggle button has descriptive label
- **Focus management:** Focus trapped in mobile sidebar
- **Reduced motion:** Animations respect `prefers-reduced-motion`

## Dependencies

```json
{
  "framer-motion": "^11.x",   // Animations
  "clsx": "^2.x",             // Class merging
  "tailwind-merge": "^2.x"    // Tailwind deduplication
}
```

---

**Version:** 1.1.0
**Last Updated:** December 2025

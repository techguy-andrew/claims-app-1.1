# Development Checkpoint Prompt

Use this prompt when starting work on the claims app to ensure consistency with established patterns.

---

## Pre-Task Checklist

Before writing code, verify:

1. **Read relevant documentation**
   - [ ] Review docs in `_barron-agency/docs/` for the feature area
   - [ ] Check existing components in `_barron-agency/components/`
   - [ ] Understand the route group structure: `(app)` vs `(public)`

2. **Check for existing patterns**
   - [ ] Search for similar implementations before creating new ones
   - [ ] Use existing hooks from `lib/hooks/` (useClaims, useItems, useAttachments, useShareLinks)
   - [ ] Follow established API route patterns in `app/api/`

3. **Plan architecture**
   - [ ] Determine if changes affect authenticated or public routes
   - [ ] Identify which components need modification
   - [ ] Consider optimistic update requirements

---

## During-Task Standards

### Components
- [ ] Place in `_barron-agency/components/` (flat structure)
- [ ] PascalCase naming matching filename
- [ ] Props interface at top of file
- [ ] Inline `cn()` utility if needed (no external imports)
- [ ] Use design tokens via Tailwind (`bg-primary`, not `bg-blue-600`)

### Icons
- [ ] Place in `_barron-agency/icons/`
- [ ] Accept `className` prop for styling
- [ ] Use `currentColor` for stroke/fill

### API Routes
- [ ] Use Next.js Route Handlers (`route.ts`)
- [ ] Return consistent JSON responses
- [ ] Include proper error handling with status codes
- [ ] Validate inputs server-side

### React Query Mutations
- [ ] Implement optimistic updates with `onMutate`
- [ ] Include rollback in `onError`
- [ ] Use proper query key structure
- [ ] Show toast notifications for user feedback

### Styling
- [ ] Tailwind utilities only (no inline styles)
- [ ] Design tokens via CSS custom properties
- [ ] Responsive design with mobile-first approach

---

## Post-Task Verification

### Code Quality
- [ ] TypeScript strict mode passes (no `any` types)
- [ ] Component is self-contained (can copy to new project)
- [ ] No console.log statements left in code

### Component Compliance
- [ ] Props interface is complete and documented
- [ ] Follows established patterns in codebase
- [ ] Uses design tokens consistently

### Documentation
- [ ] Update relevant docs if adding new features
- [ ] Add component to manifest.json if new
- [ ] Update counts in README if component/icon counts changed

---

## Feature-Specific References

| Feature | Documentation | Key Files |
|---------|--------------|-----------|
| PDF Generation | `docs/guides/PDFGeneration.md` | `ClaimPDF.tsx`, `DownloadClaimPDF.tsx` |
| Public Sharing | `docs/guides/PublicSharing.md` | `ShareClaimButton.tsx`, `useShareLinks.ts` |
| Route Groups | `docs/guides/RouteGroups.md` | `(app)/layout.tsx`, `(public)/layout.tsx` |
| Navigation | `docs/guides/Navigation.md` | `AppLayout.tsx`, `TopBar.tsx`, `Sidebar.tsx` |
| File Storage | `docs/guides/FileStorage.md` | `lib/r2.ts`, `useAttachments.ts` |
| Optimistic Updates | `docs/TechStack.md` | `useItems.ts`, `useAttachments.ts` |

---

## Quick Commands

```bash
# Development
pnpm dev              # Start dev server

# Database
pnpm prisma studio    # Database GUI
pnpm prisma migrate dev --name <name>  # Create migration

# Linting
pnpm lint             # Check for issues
```

---

**Last Updated:** December 2025
**Version:** 1.1

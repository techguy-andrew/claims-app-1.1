# Agency Development Checkpoint System

## PURPOSE

This checkpoint system ensures 100% compliance with our agency's architectural standards, philosophy, and documentation accuracy. Every developer—human or AI—must complete these checks BEFORE starting work and AFTER completing work on any task.

---

## GOLDEN RULE

**Before committing ANY code or documentation change, verify it aligns with ALL documents in `/context/`:**
- `/context/philosophy.md` - Our "why"
- `/context/tech-stack.md` - Our "how"  
- `/context/README.md` - Our "what"
- `/context/layout-architecture.md` - Our layout patterns

**If your change contradicts these documents, either:**
1. Don't make the change (it violates our philosophy), OR
2. Update the documents first (if the philosophy should evolve)

---

## PRE-TASK CHECKPOINT

Complete BEFORE starting any development work:

### 1. Context Review
- [ ] Read the relevant sections of `/context/` documents for this task
- [ ] Identify which components/patterns already exist that could be reused
- [ ] Verify the task aligns with our philosophy (ownership, portability, design tokens)
- [ ] Check if similar work has been done before (avoid rebuilding what exists)

### 2. Dependency Check
- [ ] Confirm task does NOT require adding forbidden dependencies:
  - ❌ Shadcn/UI, Material-UI, Chakra, or any component library
  - ❌ Radix UI (we build our own primitives)
  - ❌ Lucide-react or any icon library (we own our SVG icons)
- [ ] If task seems to require forbidden dependency, find owned alternative first

### 3. Architecture Planning
- [ ] Will this create new components? → Plan to add them to flat `/app/components/` structure
- [ ] Will this modify existing components? → Verify changes maintain self-containment
- [ ] Will this add new icons? → Plan to add as owned SVG components in `/app/icons/`
- [ ] Will this require new types? → Plan to add to `/types/` folder, not inline

### 4. Documentation Impact Assessment
- [ ] Will component count change? → Note: Must update README.md, tech-stack.md, philosophy.md
- [ ] Will icon count change? → Note: Must update README.md, tech-stack.md
- [ ] Will tech stack change? → Note: Must update README.md tech stack list
- [ ] Will new patterns emerge? → Note: May need to document in layout-architecture.md

---

## DURING DEVELOPMENT STANDARDS

Follow these rules while coding:

### Component Creation
- [ ] File uses PascalCase naming (e.g., `PropertyCard.tsx`, `DataTable.tsx`)
- [ ] File is located in `/app/components/` (flat structure, no subfolders)
- [ ] Props interface is defined at TOP of file with clear names
- [ ] Component uses design tokens, NOT hardcoded colors (e.g., `text-primary` not `text-blue-600`)
- [ ] Inline the `cn()` utility if needed (no import from `/lib/utils`)
- [ ] Component is self-contained (can be copied to new project and work immediately)
- [ ] JSDoc comments added to complex props (10+ props or any unclear ones)

### Icon Creation
- [ ] SVG icon component in `/app/icons/` with PascalCase naming (e.g., `CloseIcon.tsx`)
- [ ] Icon accepts `className` prop for styling flexibility
- [ ] Icon inlines `cn()` utility if needed for class merging
- [ ] Icon uses currentColor for fill/stroke (inherits text color)

### Page Creation/Modification
- [ ] Pages compose components, NO hardcoded UI elements
- [ ] Use PageHeader, PageSection, EmptyState, etc. for structure
- [ ] NO bare `<h1>`, `<p>`, `<div>` with styling - use components instead

### Mutations (Create/Update/Delete Operations)
- [ ] Implement optimistic updates with React Query
- [ ] Include `onMutate` (immediate UI update)
- [ ] Include `onError` (rollback + user notification)
- [ ] Include `onSuccess` (reconcile with server)
- [ ] Cancel in-flight queries to prevent race conditions
- [ ] Snapshot previous state for rollback capability

### Styling
- [ ] Use Tailwind utility classes exclusively
- [ ] Reference design tokens: `bg-primary`, `text-success`, `border-muted`
- [ ] NO hardcoded colors: `bg-blue-500` ❌ | `bg-primary` ✅
- [ ] NO hardcoded spacing: `p-4` ❌ | `p-spacing-md` ✅ (if using spacing tokens)
- [ ] Responsive variants use breakpoint prefixes: `md:`, `lg:`, etc.

---

## POST-TASK CHECKPOINT

Complete AFTER finishing development work, BEFORE committing:

### 1. Code Verification
- [ ] Run `pnpm build` - Verify zero TypeScript errors
- [ ] Run `pnpm lint` - Verify zero linting errors
- [ ] Test in browser - Verify functionality works as expected
- [ ] Test responsive behavior - Verify mobile/tablet/desktop layouts work

### 2. Component Compliance
- [ ] All new components pass portability test: "Can I copy this .tsx file to another project and have it work?"
- [ ] All modified components still inline utilities (no new `/lib/utils` imports added)
- [ ] All components use design tokens consistently
- [ ] Props interfaces are explicit and documented

### 3. Documentation Updates

**IF component count changed:**
- [ ] Update `/context/README.md` - Component count in "Component Library" section
- [ ] Update `/context/README.md` - Component list (add/remove from categorized list)
- [ ] Update `/context/tech-stack.md` - File structure example (add/remove component files)
- [ ] Update `/context/philosophy.md` - Component count if mentioned in philosophy text

**IF icon count changed:**
- [ ] Update `/context/README.md` - Icon count and list in "Component Library" section
- [ ] Update `/context/tech-stack.md` - File structure example in `/app/icons/` section

**IF tech stack changed (added/removed npm packages):**
- [ ] Update `/context/README.md` - "Tech Stack" section
- [ ] Update `/context/tech-stack.md` - "Languages & Frameworks" or relevant section
- [ ] Verify change aligns with philosophy (e.g., not adding forbidden component library)

**IF new pattern/variant created:**
- [ ] Consider adding example to `/context/layout-architecture.md`
- [ ] Consider adding to `/context/tech-stack.md` if architectural

### 4. Cross-Reference Accuracy
- [ ] All internal markdown links still work (`[text](./file.md)`)
- [ ] If referenced files moved/renamed, update all references
- [ ] If new document created, add cross-references from related docs

### 5. Consistency Verification
- [ ] Run mental check: "Does this contradict anything in `/context/` docs?"
- [ ] If yes → Either fix code OR update docs with explanation of why philosophy evolved

---

## CHECKPOINT CREATION (Monthly or After Major Changes)

When significant work has been completed, create a checkpoint document:

### Checkpoint Document Structure

**File:** `/context/checkpoints/checkpoint-N.md` (increment N)

**Required Sections:**
1. **Date & Summary** - When, what was accomplished
2. **Component Count** - Current total count with list of all component names
3. **Icon Count** - Current total count with list of all icon names  
4. **Tech Stack** - Current dependencies (verify against package.json)
5. **Philosophy Compliance** - Score with breakdown of any gaps
6. **Changes Since Last Checkpoint** - What was added/removed/modified
7. **Outstanding Issues** - Any known technical debt or planned improvements

**When to Create Checkpoint:**
- End of each month
- After completing major feature
- Before starting large refactor
- After onboarding new developer
- Before client demo/launch

---

## AUDIT CHECKLIST (Quarterly)

Every 3 months, run comprehensive audit:

### Cross-Document Alignment Audit
- [ ] Component counts match across all `/context/` docs
- [ ] Icon counts match across all `/context/` docs
- [ ] Tech stack lists are identical across README.md and tech-stack.md
- [ ] File structure examples in tech-stack.md match actual `/app/` directory
- [ ] Version numbers match (Next.js, TypeScript, Tailwind, etc.)
- [ ] All internal markdown links work
- [ ] No orphaned concepts (mentioned in one doc but not connected to others)

### Codebase Compliance Audit
- [ ] All components in flat `/app/components/` structure (zero subfolders)
- [ ] All icons in flat `/app/icons/` structure
- [ ] All components inline `cn()` utility
- [ ] All components have props interfaces at top
- [ ] All components use design tokens (no hardcoded colors)
- [ ] All pages compose components (no hardcoded UI)
- [ ] All mutations implement optimistic updates
- [ ] Zero forbidden dependencies in package.json

### Philosophy Alignment Audit
- [ ] Every component is self-contained and portable
- [ ] Design token system works (swap theme file, app rebrands)
- [ ] No external component libraries in use
- [ ] Component library has grown (not stagnated)
- [ ] New patterns discovered have been documented

**Target:** 100% compliance on all three audits

---

## ONBOARDING CHECKLIST (New Developers)

When new developer joins team:

### Day 1: Philosophy Immersion
- [ ] Read `/context/philosophy.md` in full - Understand the "why"
- [ ] Read `/context/tech-stack.md` in full - Understand the "how"
- [ ] Read `/context/README.md` in full - Understand the "what"
- [ ] Read `/context/layout-architecture.md` - Understand layout patterns

### Day 2: Codebase Tour
- [ ] Browse `/app/components/` - See all 20 components
- [ ] Browse `/app/icons/` - See all 10 icons
- [ ] Browse `/app/styles/themes/` - See theme system in action
- [ ] Run application locally - Experience the UX (optimistic updates, etc.)

### Day 3: First Task with Supervision
- [ ] Assign simple component modification task
- [ ] Have them complete PRE-TASK checkpoint
- [ ] Review their work against POST-TASK checkpoint
- [ ] Provide feedback on any gaps

### Ongoing: Enforce Checkpoints
- [ ] No code merged without completed POST-TASK checkpoint
- [ ] Random spot-checks to verify compliance
- [ ] Monthly review of checkpoint documents

---

## ENFORCEMENT & ACCOUNTABILITY

### For Human Developers
- **Pull Request Template** - Include POST-TASK checkpoint as PR description template
- **Code Review Requirement** - Reviewer verifies checkpoint items completed
- **Monthly Compliance Review** - Team lead audits adherence to checkpoint system

### For AI Assistants
- **Every Task Begins with:** "I will now complete the PRE-TASK checkpoint..."
- **Every Task Ends with:** "I have completed the POST-TASK checkpoint. Here's my verification..."
- **Quarterly Reminder:** Schedule automated reminder to run full compliance audit

---

## CONSEQUENCES OF NON-COMPLIANCE

**If checkpoint skipped:**
- Code is not merged until checkpoint completed
- Documentation drift creates confusion for future developers
- Component library loses portability (defeats entire philosophy)
- Client projects become slower instead of faster (loses compound advantage)

**If pattern violations found:**
- Immediate refactor required before continuing
- Root cause analysis: Why did checkpoint fail?
- Process improvement: How do we prevent recurrence?

---

## SUCCESS METRICS

**Daily:**
- ✅ Every commit includes checkpoint verification in commit message or PR

**Monthly:**  
- ✅ Checkpoint document created documenting current state
- ✅ All counts (components, icons) match across all docs

**Quarterly:**
- ✅ 100% compliance on cross-document alignment audit
- ✅ 100% compliance on codebase compliance audit
- ✅ 100% compliance on philosophy alignment audit

**Yearly:**
- ✅ Component library has grown (more reusable assets)
- ✅ New project velocity has increased (proof of compound advantage)
- ✅ Zero architectural debt (no "we should refactor this someday" items)

---

## FINAL REMINDER

**This checkpoint system is not optional.**

It's the difference between:
- A component library that compounds value ✅
- A pile of inconsistent code that becomes technical debt ❌

Every checkpoint skipped is equity lost. Every checkpoint completed is competitive advantage gained.

**When in doubt, ask:**
1. Does this align with `/context/` documents?
2. Would I be proud to show this code in 5 years?
3. Can a junior developer understand this in 5 minutes?

If all three answers are "yes," proceed. If any answer is "no," stop and refactor.

---

**Version:** 1.0  
**Last Updated:** November 19, 2025  
**Philosophy:** Maintain 100%. Always.
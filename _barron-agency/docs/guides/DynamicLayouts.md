# Dynamic Layouts: Runtime Responsive Behavior

This guide complements [LayoutArchitecture.md](./LayoutArchitecture.md) which covers static component design and semantic layout patterns. This document focuses on **runtime behavior**—how components respond to resize events, maintain state during reflow, and handle animation library conflicts with CSS layout changes.

## Core Principle: CSS for Layout, JavaScript for Interaction

Tailwind's responsive utilities handle 99% of resize scenarios automatically. The browser's CSS engine is highly optimized for reflowing layouts when viewport dimensions change. JavaScript intervention is only necessary when **animation libraries conflict with CSS reflow**.

```tsx
// This "just works" - CSS handles resize automatically
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
  {files.map(file => <FileCard key={file.id} file={file} />)}
</div>
```

When you add animation libraries like Framer Motion, you introduce a layer that manages its own transforms and positions. These inline styles can persist during resize and fight against the browser's natural CSS reflow, causing visual glitches.

## Pattern: Conditional Render During Resize

### The Problem

Animation libraries apply inline transforms (`transform: translate3d(...)`) to enable smooth drag-and-drop and layout animations. During browser resize, these transforms persist and conflict with CSS trying to reflow the layout, causing elements to:
- Stack on top of each other
- Jump to incorrect positions
- Not resize properly with their containers

### The Solution

Detect resize events and temporarily swap animated wrappers for plain elements. During the brief resize period, let CSS handle layout naturally. Once resize stops, restore full animation capabilities.

```tsx
// Resize detection hook pattern
const [isResizing, setIsResizing] = useState(false)

useEffect(() => {
  let timer: NodeJS.Timeout
  const handleResize = () => {
    setIsResizing(true)
    clearTimeout(timer)
    timer = setTimeout(() => setIsResizing(false), 250)
  }
  window.addEventListener('resize', handleResize)
  return () => {
    window.removeEventListener('resize', handleResize)
    clearTimeout(timer)
  }
}, [])
```

```tsx
// Conditional render - same content, different wrapper
const content = (
  <div className="flex items-start gap-2 w-full">
    <DragHandle disabled={isResizing} />
    <ItemCard item={item} />
  </div>
)

// During resize: plain div, CSS handles layout
if (isResizing) {
  return <div className="relative">{content}</div>
}

// Normal operation: full animation support
return (
  <Reorder.Item
    value={item}
    layout="position"
    dragControls={dragControls}
    // ... animation config
  >
    {content}
  </Reorder.Item>
)
```

### Why 250ms?

This debounce duration matches Framer Motion's internal resize handling delay. Using a shorter duration (like 100ms) can cause the animation wrapper to remount while Framer Motion still has stale transform values cached. 250ms ensures:
- User has stopped actively resizing
- Animation library internal state has cleared
- CSS reflow has completed

### Why This Approach Over Alternatives

| Approach | Problem |
|----------|---------|
| `layout={false}` during resize | Inline transforms from previous animations persist |
| `style={{ transform: 'none' }}` | Animation library overrides this |
| CSS `contain: layout` | Breaks other layout behaviors |
| Disabling specific animations | Complex, brittle, library-version-dependent |

The conditional render approach is **library-agnostic**. It doesn't rely on internal APIs or undocumented behavior. When you swap to a plain div, CSS takes full control. When you swap back, the animation library initializes fresh with correct positions.

## Pattern: Lift State to Survive Remounts

### The Problem

Conditional rendering causes component remounts. Internal React state resets when a component unmounts and remounts. If your ItemCard has an expanded FileGallery, the `isExpanded` state lives inside ItemCard—when the wrapper changes from `Reorder.Item` to `div` and back, ItemCard remounts and loses this state.

### The Solution

Use the **controlled component pattern**. Lift state that needs to survive remounts to the nearest stable parent.

#### Step 1: Add Controlled Props to Child

```tsx
// ItemCard.tsx
interface ItemCardProps {
  item: Item
  // ... other props

  // Optional controlled props - component works with or without these
  isFilesExpanded?: boolean
  onToggleFilesExpanded?: () => void
}

function ItemCard({
  item,
  isFilesExpanded: controlledExpanded,
  onToggleFilesExpanded,
  // ...
}: ItemCardProps) {
  // Internal state as fallback
  const [internalExpanded, setInternalExpanded] = useState(false)

  // Use controlled if provided, otherwise internal
  const isExpanded = controlledExpanded ?? internalExpanded
  const toggleExpanded = onToggleFilesExpanded ?? (() => setInternalExpanded(prev => !prev))

  return (
    <div>
      <button onClick={toggleExpanded}>
        {isExpanded ? 'Hide' : 'Show'} Files
      </button>
      {isExpanded && <FileGallery files={item.files} />}
    </div>
  )
}
```

#### Step 2: Track State in Parent

```tsx
// ClaimsPage.tsx
const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

const toggleItemExpanded = useCallback((itemId: string) => {
  setExpandedItems(prev => {
    const next = new Set(prev)
    if (next.has(itemId)) {
      next.delete(itemId)
    } else {
      next.add(itemId)
    }
    return next
  })
}, [])
```

#### Step 3: Pass Through Conditional Wrapper

```tsx
// The content passed to both render paths
<ItemCard
  item={item}
  isFilesExpanded={expandedItems.has(item.id)}
  onToggleFilesExpanded={() => toggleItemExpanded(item.id)}
/>
```

Now when the wrapper swaps between `div` and `Reorder.Item`, ItemCard remounts but receives the same `isFilesExpanded` value from the parent's stable state.

### Controlled/Uncontrolled Flexibility

This pattern maintains backward compatibility. Components using ItemCard without the expanded props work exactly as before (internal state). Components that need state persistence pass the controlled props. One component, two usage patterns.

## Responsive Breakpoint Reference

Tailwind's mobile-first breakpoint system used throughout our components:

| Prefix | Min Width | Typical Use |
|--------|-----------|-------------|
| (none) | 0px | Mobile-first base styles |
| `sm:` | 640px | Large phones, small tablets |
| `md:` | 768px | Tablets, small laptops |
| `lg:` | 1024px | Laptops, desktops |
| `xl:` | 1280px | Large desktops |
| `2xl:` | 1536px | Ultra-wide displays |

### Example: FileGallery Responsive Grid

```tsx
// 2 columns on mobile, 3 on sm, 4 on md+
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
  {attachments.map(attachment => (
    <FileCard key={attachment.id} file={attachment} />
  ))}
</div>
```

No JavaScript needed. CSS Grid handles column count changes during resize automatically.

## Best Practices Checklist

When implementing dynamic layouts:

- [ ] **Use Tailwind responsive utilities first** - CSS handles most resize scenarios
- [ ] **Only use JS resize detection when animations conflict** - Don't over-engineer
- [ ] **Use 250ms debounce** - Matches animation library internals
- [ ] **Extract shared content** - Same JSX used in both render paths
- [ ] **Disable interactions during resize** - Prevent drag operations while swapping wrappers
- [ ] **Lift state that needs to survive remounts** - Keep it in the nearest stable parent
- [ ] **Use controlled/uncontrolled pattern** - Maintain component flexibility
- [ ] **Test across breakpoints** - DevTools device mode, actual window resize

## When NOT to Use These Patterns

These patterns solve specific problems. Don't apply them everywhere:

### Don't use conditional render when:
- Components have no animation library involvement
- Layouts use only CSS Grid/Flexbox with Tailwind
- No drag-and-drop or layout animations present

### Don't lift state when:
- State can be reconstructed from props
- State is purely visual and resetting is acceptable
- Component never conditionally remounts

### Signs you might be over-engineering:
- Adding resize detection to components without Framer Motion
- Lifting state that nobody would notice resetting
- Wrapping simple grids in resize-aware logic

## Real-World Implementation Reference

The claims detail page (`app/(app)/claims/[id]/page.tsx`) demonstrates both patterns:

1. **Resize detection** - `isResizing` state with 250ms debounce
2. **Conditional render** - `ReorderableItem` swaps between `div` and `Reorder.Item`
3. **State lifting** - `expandedItems` Set tracks which ItemCards have FileGallery open
4. **Controlled props** - ItemCard receives `isFilesExpanded` and `onToggleFilesExpanded`

The result: draggable items with animated reordering that resize fluidly without visual glitches, maintaining user state (expanded sections) throughout.

---

*Version 1.1.0 • December 2025*

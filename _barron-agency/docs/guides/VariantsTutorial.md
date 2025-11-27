Here's how variants work in Agency Foundation:

  The Variant Pattern

  Each component defines a local variantClasses object that maps semantic variant names to Tailwind classes:

  // Button.tsx
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  }

  The Flow

  variant="destructive"
      ↓
  variantClasses["destructive"]
      ↓
  "bg-destructive text-destructive-foreground"
      ↓
  CSS: hsl(var(--destructive))
      ↓
  Theme file: --destructive: 0 84.2% 60.2%  (red)
      ↓
  Final rendered color

  Theme Swapping

  In default.css:
  --destructive: 0 84.2% 60.2%;  /* Red */

  In halloween.css:
  --destructive: 0 84.2% 60.2%;  /* Same red, or different! */
  --primary: 25 95% 53%;          /* Orange instead of blue */

  Swap theme file → all variant="default" buttons turn orange. Components unchanged.

  Components with Variants

  - Button - 6 variants + 4 sizes
  - Badge - 4 variants

  Most other components (Card, Input, Dialog) are structural and don't need color variants.

  Key Insight: Same as Framer, Different Syntax

  | Framer                    | Code                |
  |---------------------------|---------------------|
  | Variant property dropdown | variant prop        |
  | Design token in Framer    | CSS custom property |
  | Component swap            | Theme file swap     |

  The component is "thematically blind" - it says "I am a destructive action" and the theme resolves what that looks like visually.
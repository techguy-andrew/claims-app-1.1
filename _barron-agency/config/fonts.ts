/**
 * Font Configuration
 *
 * This file centralizes all font settings for easy client customization.
 *
 * HOW TO CHANGE FONTS:
 * 1. Browse Google Fonts: https://fonts.google.com/
 * 2. Find a font you like and note its exact name
 * 3. Update the 'family' field below with the exact Google Font name
 * 4. Adjust 'weights' array to match available weights for that font
 * 5. Save and rebuild - that's it!
 *
 * FONT VARIANTS:
 * - heading: Used for titles, headings, and card titles
 * - body: Used for descriptions, paragraphs, and main content
 * - label: Used for labels, badges, small text, and UI elements
 * - mono: Used for code blocks and technical content
 *
 * See FONT_SWAPPING_GUIDE.md for detailed instructions and examples.
 */

export interface FontVariantConfig {
  /**
   * Google Font family name (exact spelling from fonts.google.com)
   * Example: 'Inter', 'Roboto', 'Poppins', 'Open Sans'
   */
  family: string

  /**
   * Font weights to load (only load what you need for performance)
   * Common weights: 300 (light), 400 (regular), 500 (medium),
   *                 600 (semibold), 700 (bold), 800 (extrabold)
   */
  weights: number[]

  /**
   * CSS variable name (don't change unless you know what you're doing)
   */
  variable: string

  /**
   * Character subsets to load
   * Common: ['latin'] or ['latin', 'latin-ext']
   */
  subsets: string[]

  /**
   * Font display strategy for loading
   * 'swap' is recommended for best performance
   */
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional'

  /**
   * Fallback fonts if Google Font fails to load
   */
  fallback?: string[]
}

export interface FontConfig {
  heading: FontVariantConfig
  body: FontVariantConfig
  label: FontVariantConfig
  mono: FontVariantConfig
}

/**
 * ACTIVE FONT CONFIGURATION
 *
 * Current Setup: Open Sans (highly readable, professional)
 * - Headings: Open Sans (semibold to extrabold)
 * - Body: Open Sans (regular to medium)
 * - Labels: Open Sans (medium to semibold)
 * - Mono: Source Code Pro (for code)
 */
export const fontConfig: FontConfig = {
  heading: {
    family: 'Open Sans',
    weights: [600, 700, 800],
    variable: '--font-heading',
    subsets: ['latin'],
    display: 'swap',
    fallback: ['system-ui', 'sans-serif'],
  },
  body: {
    family: 'Open Sans',
    weights: [400, 500],
    variable: '--font-body',
    subsets: ['latin'],
    display: 'swap',
    fallback: ['system-ui', 'sans-serif'],
  },
  label: {
    family: 'Open Sans',
    weights: [500, 600],
    variable: '--font-label',
    subsets: ['latin'],
    display: 'swap',
    fallback: ['system-ui', 'sans-serif'],
  },
  mono: {
    family: 'Source Code Pro',
    weights: [400, 500],
    variable: '--font-mono',
    subsets: ['latin'],
    display: 'swap',
    fallback: ['Courier New', 'monospace'],
  },
}

/**
 * EXAMPLE CONFIGURATIONS
 *
 * Uncomment one of these to quickly switch to a different font combination.
 * Or create your own by copying the structure above!
 */

// ===== EXAMPLE 1: Inter (Popular, Highly Readable) =====
// export const fontConfig: FontConfig = {
//   heading: {
//     family: 'Inter',
//     weights: [600, 700, 800],
//     variable: '--font-heading',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['system-ui', 'sans-serif'],
//   },
//   body: {
//     family: 'Inter',
//     weights: [400, 500, 600],
//     variable: '--font-body',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['system-ui', 'sans-serif'],
//   },
//   label: {
//     family: 'Inter',
//     weights: [500, 600],
//     variable: '--font-label',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['system-ui', 'sans-serif'],
//   },
//   mono: {
//     family: 'JetBrains Mono',
//     weights: [400, 500],
//     variable: '--font-mono',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['Courier New', 'monospace'],
//   },
// }

// ===== EXAMPLE 2: Poppins + Roboto (Modern & Friendly) =====
// export const fontConfig: FontConfig = {
//   heading: {
//     family: 'Poppins',
//     weights: [600, 700, 800],
//     variable: '--font-heading',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['system-ui', 'sans-serif'],
//   },
//   body: {
//     family: 'Roboto',
//     weights: [400, 500],
//     variable: '--font-body',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['system-ui', 'sans-serif'],
//   },
//   label: {
//     family: 'Roboto',
//     weights: [500, 600],
//     variable: '--font-label',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['system-ui', 'sans-serif'],
//   },
//   mono: {
//     family: 'Source Code Pro',
//     weights: [400, 500],
//     variable: '--font-mono',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['Courier New', 'monospace'],
//   },
// }

// ===== EXAMPLE 3: Playfair Display + Lato (Elegant & Professional) =====
// export const fontConfig: FontConfig = {
//   heading: {
//     family: 'Playfair Display',
//     weights: [600, 700, 800],
//     variable: '--font-heading',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['Georgia', 'serif'],
//   },
//   body: {
//     family: 'Lato',
//     weights: [400, 500],
//     variable: '--font-body',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['system-ui', 'sans-serif'],
//   },
//   label: {
//     family: 'Lato',
//     weights: [500, 600],
//     variable: '--font-label',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['system-ui', 'sans-serif'],
//   },
//   mono: {
//     family: 'Fira Code',
//     weights: [400, 500],
//     variable: '--font-mono',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['Courier New', 'monospace'],
//   },
// }

// ===== EXAMPLE 4: Montserrat (Bold & Impactful) =====
// export const fontConfig: FontConfig = {
//   heading: {
//     family: 'Montserrat',
//     weights: [600, 700, 800],
//     variable: '--font-heading',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['system-ui', 'sans-serif'],
//   },
//   body: {
//     family: 'Montserrat',
//     weights: [400, 500],
//     variable: '--font-body',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['system-ui', 'sans-serif'],
//   },
//   label: {
//     family: 'Montserrat',
//     weights: [500, 600],
//     variable: '--font-label',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['system-ui', 'sans-serif'],
//   },
//   mono: {
//     family: 'Roboto Mono',
//     weights: [400, 500],
//     variable: '--font-mono',
//     subsets: ['latin'],
//     display: 'swap',
//     fallback: ['Courier New', 'monospace'],
//   },
// }

/**
 * CLIENT-SPECIFIC CONFIGURATIONS (Future Implementation)
 *
 * For multi-client projects, you can organize like this:
 *
 * config/
 *   ├── fonts/
 *   │   ├── client-a.ts
 *   │   ├── client-b.ts
 *   │   └── default.ts
 *   └── fonts.ts  (exports from active client)
 *
 * Then in fonts.ts:
 * export * from './fonts/default'  // Change per client
 */

/**
 * Icon Configuration
 *
 * This file centralizes all icon SVG path data for easy client customization.
 * To swap icons for a different client:
 * 1. Add new SVG file to app/styles/svg icons/
 * 2. Copy the path data below
 * 3. Update the relevant icon config
 *
 * SVG files are in: app/styles/svg icons/
 */

export interface IconPathConfig {
  viewBox: string
  paths: Array<{
    d: string
    fill?: string
    opacity?: string
    fillRule?: 'nonzero' | 'evenodd' | 'inherit'
    clipRule?: 'nonzero' | 'evenodd' | 'inherit'
    stroke?: string
    strokeWidth?: string
    strokeLinecap?: 'butt' | 'round' | 'square' | 'inherit'
  }>
}

/**
 * Loading Icon Configuration
 *
 * Current: Simple circular spinner (from loading-icon.svg)
 * To swap: Replace paths array with new SVG path data
 */
export const loadingIconConfig: IconPathConfig = {
  viewBox: '0 0 16 16',
  paths: [
    {
      d: 'M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z',
      fill: 'currentColor',
      opacity: '0.2',
      fillRule: 'evenodd',
      clipRule: 'evenodd',
    },
    {
      d: 'M7.25.75A.75.75 0 018 0a8 8 0 018 8 .75.75 0 01-1.5 0A6.5 6.5 0 008 1.5a.75.75 0 01-.75-.75z',
      fill: 'currentColor',
      fillRule: 'evenodd',
      clipRule: 'evenodd',
    },
  ],
}

/**
 * Menu Icon Configuration
 *
 * Current: Three dots in circle (from menu-icon.svg)
 * To swap: Replace paths array with new SVG path data
 */
export const menuIconConfig: IconPathConfig = {
  viewBox: '0 0 24 24',
  paths: [
    {
      d: 'M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z',
      fill: 'currentColor',
      opacity: '0.5',
    },
    {
      d: 'M8 13C8.55228 13 9 12.5523 9 12C9 11.4477 8.55228 11 8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13Z',
      fill: 'currentColor',
    },
    {
      d: 'M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z',
      fill: 'currentColor',
    },
    {
      d: 'M16 13C16.5523 13 17 12.5523 17 12C17 11.4477 16.5523 11 16 11C15.4477 11 15 11.4477 15 12C15 12.5523 15.4477 13 16 13Z',
      fill: 'currentColor',
    },
  ],
}

/**
 * Save Icon Configuration
 *
 * Current: Circle with checkmark (from save-icon.svg)
 * To swap: Replace paths array with new SVG path data
 */
export const saveIconConfig: IconPathConfig = {
  viewBox: '0 0 24 24',
  paths: [
    {
      d: 'M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z',
      fill: 'currentColor',
      opacity: '0.5',
    },
    {
      d: 'M16.0303 8.96967C16.3232 9.26256 16.3232 9.73744 16.0303 10.0303L11.0303 15.0303C10.7374 15.3232 10.2626 15.3232 9.96967 15.0303L7.96967 13.0303C7.67678 12.7374 7.67678 12.2626 7.96967 11.9697C8.26256 11.6768 8.73744 11.6768 9.03033 11.9697L10.5 13.4393L12.7348 11.2045L14.9697 8.96967C15.2626 8.67678 15.7374 8.67678 16.0303 8.96967Z',
      fill: 'currentColor',
    },
  ],
}

/**
 * Cancel Icon Configuration
 *
 * Current: Circle with X (from cancel-icon.svg)
 * To swap: Replace paths array with new SVG path data
 */
export const cancelIconConfig: IconPathConfig = {
  viewBox: '0 0 24 24',
  paths: [
    {
      d: 'M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z',
      fill: 'currentColor',
      opacity: '0.5',
    },
    {
      d: 'M8.96967 8.96967C9.26256 8.67678 9.73744 8.67678 10.0303 8.96967L12 10.9394L13.9697 8.96969C14.2626 8.6768 14.7374 8.6768 15.0303 8.96969C15.3232 9.26258 15.3232 9.73746 15.0303 10.0304L13.0607 12L15.0303 13.9696C15.3232 14.2625 15.3232 14.7374 15.0303 15.0303C14.7374 15.3232 14.2625 15.3232 13.9696 15.0303L12 13.0607L10.0304 15.0303C9.73746 15.3232 9.26258 15.3232 8.96969 15.0303C8.6768 14.7374 8.6768 14.2626 8.96969 13.9697L10.9394 12L8.96967 10.0303C8.67678 9.73744 8.67678 9.26256 8.96967 8.96967Z',
      fill: 'currentColor',
    },
  ],
}

/**
 * Example: Alternative loading icon configuration
 *
 * Uncomment and use this to see how easy it is to swap icons
 */
// export const loadingIconConfig: IconPathConfig = {
//   viewBox: '0 0 24 24',
//   paths: [
//     {
//       d: 'M12 2C6.47715 2 2 6.47715 2 12',
//       stroke: 'currentColor',
//       strokeWidth: '3',
//       strokeLinecap: 'round',
//     },
//   ],
// }

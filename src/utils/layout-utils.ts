/**
 * Utility functions for layout and styling
 */

/**
 * Common border styles used throughout the application
 */
export const borderStyles = {
  dashed: '1px dashed var(--mantine-color-dark-5) !important',
  dashedDark4: '1px dashed var(--mantine-color-dark-4) !important',
} as const;

/**
 * Common background colors
 */
export const backgroundColors = {
  dark8: 'dark.8',
  dark9: 'dark.9',
} as const;

/**
 * AppShell configuration constants
 */
export const appShellConfig = {
  layout: 'alt' as const,
  header: { height: 62 },
  navbar: {
    width: 300,
    breakpoint: 'sm' as const,
    collapsed: { desktop: true },
  },
} as const;

/**
 * Container styles for consistent layout
 */
export const containerStyles = {
  paddingInline: '0 !important',
  borderLeft: borderStyles.dashed,
  borderRight: borderStyles.dashed,
} as const;

/**
 * Gets responsive text alignment styles
 */
export function getResponsiveTextAlign() {
  return { base: 'center' as const, sm: 'left' as const };
}

/**
 * Gets current year for copyright
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

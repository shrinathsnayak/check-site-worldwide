import { rem } from '@mantine/core';

/**
 * Common font sizes used throughout the application
 */
export const fontSizes = {
  xs: rem(12),
  sm: rem(14),
  md: rem(16),
  lg: rem(18),
  xl: rem(20),
  xxl: rem(24),
  title: {
    small: { base: rem(22), sm: rem(35) },
    medium: { base: rem(40), sm: rem(50) },
    description: { base: rem(14), sm: rem(16) },
  },
} as const;

/**
 * Common spacing values
 */
export const spacing = {
  xs: rem(4),
  sm: rem(8),
  md: rem(16),
  lg: rem(24),
  xl: rem(32),
  xxl: rem(48),
  heroTop: { base: rem(55), sm: rem(70) },
  sectionGap: rem(50),
} as const;

/**
 * Common color values
 */
export const colors = {
  text: {
    primary: 'white',
    secondary: 'dimmed',
    accent: 'red.7',
    brand: 'red.8',
  },
  status: {
    success: 'green',
    error: 'red',
    warning: 'blue',
    pending: 'gray',
  },
} as const;

/**
 * Grid configurations
 */
export const gridConfigs = {
  responsive: {
    small: { base: 1, sm: 2, md: 3 },
    medium: { base: 1, sm: 2, md: 2 },
  },
  spacing: {
    sm: 'sm',
    xl: { base: 'xl', md: 'xl' },
  },
} as const;

/**
 * Creates responsive font size object
 */
export function createResponsiveFontSize(baseSize: string, smSize: string) {
  return { base: rem(baseSize), sm: rem(smSize) };
}

/**
 * Creates responsive spacing object
 */
export function createResponsiveSpacing(baseSize: string, smSize: string) {
  return { base: rem(baseSize), sm: rem(smSize) };
}

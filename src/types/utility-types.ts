/**
 * Feature data type
 */
export type FeatureData = {
  icon: React.FC<{ size?: number; stroke?: number }>;
  title: string;
  description: string;
};

/**
 * Hero feature item type
 */
export type HeroFeatureItem = {
  text: string;
  isSeparator: boolean;
};

/**
 * Responsive text alignment type
 */
export type ResponsiveTextAlign = {
  base: 'center';
  sm: 'left';
};

/**
 * Font size configuration type
 */
export type FontSizeConfig = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  title: {
    small: { base: string; sm: string };
    medium: { base: string; sm: string };
    description: { base: string; sm: string };
  };
};

/**
 * Spacing configuration type
 */
export type SpacingConfig = {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  heroTop: { base: string; sm: string };
  sectionGap: string;
};

/**
 * Color configuration type
 */
export type ColorConfig = {
  text: {
    primary: string;
    secondary: string;
    accent: string;
    brand: string;
  };
  status: {
    success: string;
    error: string;
    warning: string;
    pending: string;
  };
};

/**
 * Grid configuration type
 */
export type GridConfig = {
  responsive: {
    small: { base: number; sm: number; md: number };
    medium: { base: number; sm: number; md: number };
  };
  spacing: {
    sm: string;
    xl: { base: string; md: string };
  };
};

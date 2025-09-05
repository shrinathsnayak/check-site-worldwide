/**
 * Utility functions and data for Hero components
 */

// Import function from data-mappers
import { getHeroFeatureItems as getHeroFeatureItemsFromArray } from './data-mappers';

/**
 * Feature text items for the hero section
 */
export const HERO_FEATURES = [
  'Global Coverage',
  'Instant Results',
  'Real Proxies',
] as const;

/**
 * Bullet separator for hero features
 */
export const HERO_FEATURE_SEPARATOR = '•';

/**
 * Gets hero feature items with separators
 */
export function getHeroFeatureItems() {
  return getHeroFeatureItemsFromArray(HERO_FEATURES);
}

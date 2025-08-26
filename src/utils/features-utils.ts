import {
  IconGlobe,
  IconClock,
  IconShield,
  IconCode,
} from '@tabler/icons-react';
import { getCountryAndContinentCounts } from '@/utils/utils';
import type { FeatureProps } from '@/types/types';
import type { FeatureData } from '@/types/utility-types';

const { countryCount, continentCount } = getCountryAndContinentCounts();

/**
 * Feature data for the Features component
 */
export const FEATURES_DATA = [
  {
    icon: IconGlobe,
    title: 'Global Coverage',
    description: `Test from ${countryCount} countries across ${continentCount} continents. Comprehensive regional testing worldwide.`,
  },
  {
    icon: IconClock,
    title: 'Instant Results',
    description:
      'Parallel testing delivers results in seconds with smart caching.',
  },
  {
    icon: IconShield,
    title: 'Premium Proxies',
    description: "Real IP addresses from Webshare's premium proxy network.",
  },
  {
    icon: IconCode,
    title: 'Detailed Analytics',
    description:
      'Get comprehensive reports with response times, status codes, and regional insights.',
  },
] as const;

/**
 * Type for feature data items
 */
export type FeatureData = typeof FEATURES_DATA[number];

// Re-export from mappers
export { mapFeatureDataToProps } from './data-mappers';

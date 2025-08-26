import { ALL_COUNTRIES } from '@/utils/countries';
import { groupCountriesByRegionWithSupport } from '@/utils/grouping-utils';

// Re-export types
export type { CountryWithSupport } from '@/types/component-types';

/**
 * Gets all supported countries with region grouping
 */
export function getSupportedCountriesGroupedByRegion(): {
  resultsByRegion: Record<string, CountryWithSupport[]>;
  regions: string[];
} {
  const resultsByRegion = groupCountriesByRegionWithSupport(
    ALL_COUNTRIES.map(country => ({
      ...country,
      supported: true, // All countries in ALL_COUNTRIES are supported
    }))
  );

  const regions = Object.keys(resultsByRegion).sort((a, b) =>
    a.localeCompare(b)
  );

  return { resultsByRegion, regions };
}

/**
 * Gets country count for a region
 */
export function getCountryCountForRegion(
  countries: CountryWithSupport[]
): number {
  return countries.length;
}

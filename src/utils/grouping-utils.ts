import type { CountryWithSupport } from '@/types/component-types';

/**
 * Groups countries by region for display purposes
 */
export function groupCountriesByRegion<T extends { region: string }>(
  countries: T[]
): Record<string, T[]> {
  return countries.reduce(
    (acc, country) => {
      if (!acc[country.region]) {
        acc[country.region] = [];
      }
      acc[country.region].push(country);
      return acc;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Groups countries by region with support information
 */
export function groupCountriesByRegionWithSupport(
  countries: CountryWithSupport[]
): Record<string, CountryWithSupport[]> {
  return groupCountriesByRegion(countries);
}

/**
 * Gets country count for a region
 */
export function getCountryCountForRegion<T>(countries: T[]): number {
  return countries.length;
}

'use client';

import { Box, Title, SimpleGrid } from '@mantine/core';
import type { CheckResult } from '@/types/types';
import {
  groupCountriesByRegion,
  type CountryStatus,
} from '@/utils/country-status-utils';
import CountryCard from './CountryCard';

import type { ResultsGridProps } from '@/types/component-types';

export default function ResultsGrid({ countries }: ResultsGridProps) {
  // Group countries by region
  const countryByRegion = groupCountriesByRegion(countries);
  const regions = Object.keys(countryByRegion).sort((a, b) =>
    a.localeCompare(b)
  );

  return (
    <>
      {regions.map(region => (
        <Box key={region} mb='lg'>
          <Title order={5} fw={700} mb='xs'>
            {region} ({countryByRegion[region].length})
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='sm'>
            {countryByRegion[region].map(country => (
              <CountryCard
                key={country.code}
                country={country}
                status={country.status}
                result={country.result}
              />
            ))}
          </SimpleGrid>
        </Box>
      ))}
    </>
  );
}

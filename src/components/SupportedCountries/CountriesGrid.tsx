import { SimpleGrid } from '@mantine/core';
import CountryCard from './CountryCard';
import type { CountryWithSupport } from '@/utils/countries-display-utils';

import type { CountriesGridProps } from '@/types/component-types';

export default function CountriesGrid({ countries }: CountriesGridProps) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='sm'>
      {countries.map(country => (
        <CountryCard key={`${country.code}-${country.name}`} country={country} />
      ))}
    </SimpleGrid>
  );
}

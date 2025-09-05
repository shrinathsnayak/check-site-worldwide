import { Box, Title, Container, rem } from '@mantine/core';
import CountriesGrid from './SupportedCountries/CountriesGrid';
import {
  getSupportedCountriesGroupedByRegion,
  getCountryCountForRegion,
} from '@/utils/countries-display-utils';

export default function SupportedCountries() {
  const { resultsByRegion, regions } = getSupportedCountriesGroupedByRegion();

  return (
    <Container size='md'>
      <Title
        mb={rem(50)}
        order={2}
        fz={{ base: rem(22), sm: rem(35) }}
        ta='center'
        c='white'
      >
        Supported countries
      </Title>
      {regions.map(region => (
        <Box key={region} mb='lg'>
          <Title order={5} fw={700} mb='xs'>
            {region} ({getCountryCountForRegion(resultsByRegion[region])})
          </Title>
          <CountriesGrid countries={resultsByRegion[region]} />
        </Box>
      ))}
    </Container>
  );
}

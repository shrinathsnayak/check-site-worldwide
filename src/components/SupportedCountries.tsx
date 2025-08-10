import {
  Box,
  SimpleGrid,
  Group,
  Text,
  Space,
  Title,
  Container,
  rem,
  Paper,
} from '@mantine/core';
import { ALL_COUNTRIES } from '@/utils/countries';
import { getCountryFlagFromISOCode } from '@/utils/utils';

function CountriesGrid({
  countries,
}: {
  countries: Array<{
    code: string;
    name: string;
    region: string;
    continent: string;
    supported: boolean;
  }>;
}) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='sm'>
      {countries.map(country => {
        return (
          <Paper key={`${country.code}-${country.name}`} p='md'>
            <Group justify='space-between' mb={6} wrap='nowrap'>
              <Group gap={8} wrap='nowrap'>
                <Text size='xl' style={{ lineHeight: 1 }}>
                  {getCountryFlagFromISOCode(country.code)}
                </Text>
                <Text fw={600}>{country.name}</Text>
              </Group>
            </Group>
            <Space h={6} />
            <Group gap='md'>
              <Text size='sm' c='dimmed'>
                Code: {country.code}
              </Text>
              <Text size='sm' c='dimmed'>
                Continent: {country.continent}
              </Text>
            </Group>
          </Paper>
        );
      })}
    </SimpleGrid>
  );
}

export default function SupportedCountries() {
  const resultsByRegion = ALL_COUNTRIES.reduce(
    (acc, c) => {
      if (!acc[c.region]) acc[c.region] = [];
      acc[c.region].push(c);
      return acc;
    },
    {} as Record<
      string,
      Array<{
        code: string;
        name: string;
        region: string;
        continent: string;
        supported: boolean;
      }>
    >
  );

  const regions = Object.keys(resultsByRegion).sort((a, b) =>
    a.localeCompare(b)
  );

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
            {region} ({resultsByRegion[region].length})
          </Title>
          <CountriesGrid countries={resultsByRegion[region]} />
        </Box>
      ))}
    </Container>
  );
}

import { Group, Text, Space, Paper } from '@mantine/core';
import { getCountryFlagFromISOCode } from '@/utils/utils';
import type { CountryWithSupport } from '@/types/component-types';

interface CountryCardProps {
  country: CountryWithSupport;
}

export default function CountryCard({ country }: CountryCardProps) {
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
}

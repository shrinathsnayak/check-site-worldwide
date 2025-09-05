'use client';

import { Table, Badge, Text, Group, Loader, Box, Title } from '@mantine/core';
import { IconCheck, IconX, IconClock } from '@tabler/icons-react';
import type { CheckResult } from '@/types/types';
import {
  getCountryFlagFromISOCode,
  millisecondsToSeconds,
} from '@/utils/utils';
import {
  getStatusColor,
  groupCountriesByRegion,
  type CountryStatus,
} from '@/utils/country-status-utils';

interface ResultsTableProps {
  // For streaming results
  countries?: Array<{
    code: string;
    name: string;
    region: string;
    status: CountryStatus;
    result?: CheckResult;
  }>;
  // For regular results
  resultsByRegion?: Record<string, CheckResult[]>;
}

function getStatusIcon(status: string, result?: CheckResult) {
  switch (status) {
    case 'completed':
      return result?.accessible ? (
        <IconCheck size={16} color='var(--mantine-color-green-6)' />
      ) : (
        <IconX size={16} color='var(--mantine-color-red-6)' />
      );
    case 'error':
      return <IconX size={16} color='var(--mantine-color-red-6)' />;
    case 'loading':
      return <Loader size={16} />;
    default:
      return <IconClock size={16} color='var(--mantine-color-gray-6)' />;
  }
}

function getStatusBadge(status: CountryStatus, result?: CheckResult) {
  switch (status) {
    case 'completed':
      return (
        <Badge color={getStatusColor(status, result)} variant='light' size='sm'>
          {result?.statusCode}
        </Badge>
      );
    case 'error':
      return (
        <Badge color={getStatusColor(status, result)} variant='light' size='sm'>
          Error
        </Badge>
      );
    case 'loading':
      return (
        <Badge color={getStatusColor(status, result)} variant='light' size='sm'>
          Checking...
        </Badge>
      );
    default:
      return (
        <Badge color={getStatusColor(status, result)} variant='light' size='sm'>
          Pending
        </Badge>
      );
  }
}

export default function ResultsTable({
  countries,
  resultsByRegion,
}: ResultsTableProps) {
  // Handle both streaming countries and regular results
  let regions: string[];
  let countryByRegion: Record<string, any>;

  if (countries) {
    // Streaming results: group countries by region using utility function
    countryByRegion = groupCountriesByRegion(countries);
    regions = Object.keys(countryByRegion).sort((a, b) => a.localeCompare(b));
  } else if (resultsByRegion) {
    // Regular results: use provided grouping
    countryByRegion = resultsByRegion;
    regions = Object.keys(resultsByRegion).sort((a, b) => a.localeCompare(b));
  } else {
    return null;
  }

  return (
    <Box>
      {regions.map(region => (
        <Box key={region} mb='lg'>
          <Title order={5} fw={700} mb='xs'>
            {region} ({countryByRegion[region].length})
          </Title>

          <Table withTableBorder verticalSpacing='sm'>
            <Table.Thead>
              <Table.Tr>
                <Table.Th c='dimmed'>Country</Table.Th>
                <Table.Th c='dimmed'>Status</Table.Th>
                <Table.Th c='dimmed'>Total Time</Table.Th>
                <Table.Th c='dimmed'>IP Address</Table.Th>
                <Table.Th c='dimmed'>DNS</Table.Th>
                <Table.Th c='dimmed'>Connect</Table.Th>
                <Table.Th c='dimmed'>TLS</Table.Th>
                <Table.Th c='dimmed'>TTFB</Table.Th>
                <Table.Th c='dimmed'>Transfer</Table.Th>
                <Table.Th c='dimmed'>Latency</Table.Th>
                <Table.Th c='dimmed'>Error</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {countryByRegion[region].map((item: any) => {
                // Handle both streaming countries and regular results
                const isStreamingCountry = 'status' in item;
                const result = isStreamingCountry ? item.result : item;
                const country = isStreamingCountry ? item : null;

                return (
                  <Table.Tr
                    key={
                      isStreamingCountry
                        ? country.code
                        : `${result.country}-${result.timestamp}`
                    }
                  >
                    <Table.Td>
                      <Group gap={8} wrap='nowrap'>
                        <Text size='lg' style={{ lineHeight: 1 }}>
                          {getCountryFlagFromISOCode(
                            isStreamingCountry ? country.code : result.country
                          )}
                        </Text>
                        <Text size='sm' fw={500}>
                          {isStreamingCountry
                            ? country.name
                            : result.countryName}
                        </Text>
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      <Group gap={4} wrap='nowrap'>
                        {isStreamingCountry ? (
                          <>
                            {getStatusIcon(country.status, result)}
                            {getStatusBadge(country.status, result)}
                          </>
                        ) : (
                          <>
                            {result.accessible ? (
                              <IconCheck
                                size={16}
                                color='var(--mantine-color-green-6)'
                              />
                            ) : (
                              <IconX
                                size={16}
                                color='var(--mantine-color-red-6)'
                              />
                            )}
                            <Badge
                              color={result.accessible ? 'green' : 'red'}
                              variant='light'
                              size='sm'
                            >
                              {result.accessible
                                ? 'Accessible'
                                : 'Inaccessible'}
                            </Badge>
                          </>
                        )}
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      {result ? (
                        <Text size='sm' fw={500} c='white'>
                          {millisecondsToSeconds(result.responseTime)}s
                        </Text>
                      ) : (
                        <Text size='sm' c='white'>
                          -
                        </Text>
                      )}
                    </Table.Td>

                    <Table.Td>
                      <Text size='sm' c='white'>
                        {result?.usedIp || '-'}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text size='sm' c='white'>
                        {result?.timings?.dnsFetch
                          ? `${result.timings.dnsFetch}ms`
                          : '-'}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text size='sm' c='white'>
                        {result?.timings?.connect
                          ? `${result.timings.connect}ms`
                          : '-'}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text size='sm' c='white'>
                        {result?.timings?.tls ? `${result.timings.tls}ms` : '-'}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text size='sm' c='white'>
                        {result?.timings?.ttfb
                          ? `${result.timings.ttfb}ms`
                          : '-'}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text size='sm' c='white'>
                        {result?.timings?.transfer
                          ? `${result.timings.transfer}ms`
                          : '-'}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text size='sm' c='white'>
                        {result?.timings?.latency
                          ? `${result.timings.latency}ms`
                          : '-'}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      {result?.error ? (
                        <Text size='sm' c='red' lineClamp={2}>
                          {result.error}
                        </Text>
                      ) : (
                        <Text size='sm' c='dimmed'>
                          -
                        </Text>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </Box>
      ))}
    </Box>
  );
}

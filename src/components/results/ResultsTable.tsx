'use client';

import {
  Table,
  Badge,
  Text,
  Group,
  Loader,
  Box,
  Title,
} from '@mantine/core';
import { IconCheck, IconX, IconClock } from '@tabler/icons-react';
import type { CheckResult } from '@/types/types';
import {
  getCountryFlagFromISOCode,
  millisecondsToSeconds,
} from '@/utils/utils';

interface ResultsTableProps {
  // For streaming results
  countries?: Array<{
    code: string;
    name: string;
    region: string;
    status: 'pending' | 'loading' | 'completed' | 'error';
    result?: CheckResult;
  }>;
  // For regular results
  resultsByRegion?: Record<string, CheckResult[]>;
}

function getStatusIcon(status: string, result?: CheckResult) {
  switch (status) {
    case 'completed':
      return result?.accessible ? (
        <IconCheck size={16} color="var(--mantine-color-green-6)" />
      ) : (
        <IconX size={16} color="var(--mantine-color-red-6)" />
      );
    case 'error':
      return <IconX size={16} color="var(--mantine-color-red-6)" />;
    case 'loading':
      return <Loader size={16} />;
    default:
      return <IconClock size={16} color="var(--mantine-color-gray-6)" />;
  }
}

function getStatusBadge(status: string, result?: CheckResult) {
  switch (status) {
    case 'completed':
      return (
        <Badge
          color={result?.accessible ? 'green' : 'red'}
          variant="light"
          size="sm"
        >
          {result?.accessible ? 'Accessible' : 'Inaccessible'}
        </Badge>
      );
    case 'error':
      return <Badge color="red" variant="light" size="sm">Error</Badge>;
    case 'loading':
      return <Badge color="blue" variant="light" size="sm">Checking...</Badge>;
    default:
      return <Badge color="gray" variant="light" size="sm">Pending</Badge>;
  }
}

export default function ResultsTable({ countries, resultsByRegion }: ResultsTableProps) {
  // Handle both streaming countries and regular results
  let regions: string[];
  let countryByRegion: Record<string, any>;

  if (countries) {
    // Streaming results: group countries by region
    countryByRegion = countries.reduce((acc, country) => {
      if (!acc[country.region]) {
        acc[country.region] = [];
      }
      acc[country.region].push(country);
      return acc;
    }, {} as Record<string, typeof countries>);
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
        <Box key={region} mb="lg">
          <Title order={5} fw={700} mb="xs">
            {region} ({countryByRegion[region].length})
          </Title>

          <Table withTableBorder verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Country</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Total Time</Table.Th>
                <Table.Th>IP Address</Table.Th>
                <Table.Th>DNS</Table.Th>
                <Table.Th>Connect</Table.Th>
                <Table.Th>TLS</Table.Th>
                <Table.Th>TTFB</Table.Th>
                <Table.Th>Transfer</Table.Th>
                <Table.Th>Latency</Table.Th>
                <Table.Th>Error</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {countryByRegion[region].map((item: any) => {
                // Handle both streaming countries and regular results
                const isStreamingCountry = 'status' in item;
                const result = isStreamingCountry ? item.result : item;
                const country = isStreamingCountry ? item : null;

                return (
                  <Table.Tr key={isStreamingCountry ? country.code : `${result.country}-${result.timestamp}`}>
                    <Table.Td>
                      <Group gap={8} wrap="nowrap">
                        <Text size="lg" style={{ lineHeight: 1 }}>
                          {getCountryFlagFromISOCode(isStreamingCountry ? country.code : result.country)}
                        </Text>
                        <Text size="sm" fw={500}>
                          {isStreamingCountry ? country.name : result.countryName}
                        </Text>
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        {isStreamingCountry ? (
                          <>
                            {getStatusIcon(country.status, result)}
                            {getStatusBadge(country.status, result)}
                          </>
                        ) : (
                          <>
                            {result.accessible ? (
                              <IconCheck size={16} color="var(--mantine-color-green-6)" />
                            ) : (
                              <IconX size={16} color="var(--mantine-color-red-6)" />
                            )}
                            <Badge
                              color={result.accessible ? 'green' : 'red'}
                              variant="light"
                              size="sm"
                            >
                              {result.accessible ? 'Accessible' : 'Inaccessible'}
                            </Badge>
                          </>
                        )}
                      </Group>
                    </Table.Td>

                    <Table.Td>
                      {result ? (
                        <Text size="sm" fw={500}>
                          {millisecondsToSeconds(result.responseTime)}s
                        </Text>
                      ) : (
                        <Text size="sm" c="dimmed">-</Text>
                      )}
                    </Table.Td>

                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {result?.usedIp || '-'}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {result?.timings?.dnsFetch ? `${result.timings.dnsFetch}ms` : '-'}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {result?.timings?.connect ? `${result.timings.connect}ms` : '-'}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {result?.timings?.tls ? `${result.timings.tls}ms` : '-'}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {result?.timings?.ttfb ? `${result.timings.ttfb}ms` : '-'}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {result?.timings?.transfer ? `${result.timings.transfer}ms` : '-'}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {result?.timings?.latency ? `${result.timings.latency}ms` : '-'}
                      </Text>
                    </Table.Td>

                    <Table.Td>
                      {result?.error ? (
                        <Text size="sm" c="red" lineClamp={2}>
                          {result.error}
                        </Text>
                      ) : (
                        <Text size="sm" c="dimmed">-</Text>
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

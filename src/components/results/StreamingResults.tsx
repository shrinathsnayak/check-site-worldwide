'use client';

import { useEffect } from 'react';
import {
  Container,
  Title,
  Alert,
  Group,
  Box,
  Badge,
  Progress,
  SimpleGrid,
  Text,
  Space,
  Loader,
  Button,
} from '@mantine/core';
import { IconCheck, IconX, IconClock } from '@tabler/icons-react';
import { useStreamingCheck } from '@/hooks/useStreamingCheck';
import type { CheckResult } from '@/types/types';
import {
  getCountryFlagFromISOCode,
  millisecondsToSeconds,
} from '@/utils/utils';

interface StreamingResultsProps {
  url: string;
  countries?: string[];
}

function CountryCard({
  country,
  status,
  result
}: {
  country: { code: string; name: string; region: string };
  status: 'pending' | 'loading' | 'completed' | 'error';
  result?: CheckResult;
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'completed': return result?.accessible ? 'green' : 'red';
      case 'error': return 'red';
      case 'loading': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return result?.accessible ? <IconCheck size={16} /> : <IconX size={16} />;
      case 'error': return <IconX size={16} />;
      case 'loading': return <Loader size={16} />;
      default: return <IconClock size={16} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed': return result?.accessible ? 'Accessible' : 'Inaccessible';
      case 'error': return 'Error';
      case 'loading': return 'Checking...';
      default: return 'Pending';
    }
  };

  const getBg = () => {
    if (status === 'completed' && result?.accessible) return 'rgba(34,197,94,0.12)';
    if (status === 'completed' && !result?.accessible) return 'rgba(239,68,68,0.12)';
    if (status === 'loading') return 'rgba(59,130,246,0.12)';
    return 'rgba(156,163,175,0.12)';
  };

  const getBorder = () => {
    if (status === 'completed' && result?.accessible) return '1px solid rgba(34,197,94,0.25)';
    if (status === 'completed' && !result?.accessible) return '1px solid rgba(239,68,68,0.25)';
    if (status === 'loading') return '1px solid rgba(59,130,246,0.25)';
    return '1px solid rgba(156,163,175,0.25)';
  };

  return (
    <Box
      p="md"
      style={{
        backgroundColor: getBg(),
        borderRadius: 12,
        border: getBorder(),
      }}
    >
      <Group justify="space-between" mb={6} wrap="nowrap">
        <Group gap={8} wrap="nowrap">
          <Text size="xl" style={{ lineHeight: 1 }}>
            {getCountryFlagFromISOCode(country.code)}
          </Text>
          <Text fw={600}>{country.name}</Text>
        </Group>
        <Badge color={getStatusColor()} variant="light">
          <Group gap={4} wrap="nowrap">
            {getStatusIcon()}
            {getStatusText()}
          </Group>
        </Badge>
      </Group>
      <Space h={6} />
      {status === 'completed' && result?.accessible ? (
        <Group gap="md">
          <Text size="sm">
            Time: {millisecondsToSeconds(result.responseTime)}s
          </Text>
          <Text size="sm">IP: {result.usedIp}</Text>
        </Group>
      ) : status === 'completed' && result ? (
        <Text size="sm">{result.error ?? 'Unknown error'}</Text>
      ) : status === 'loading' ? (
        <Text size="sm" c="blue">
          Checking accessibility...
        </Text>
      ) : (
        <Text size="sm" c="gray">
          Waiting to start...
        </Text>
      )}
    </Box>
  );
}

function ResultsGrid({
  countries
}: {
  countries: Array<{
    code: string;
    name: string;
    region: string;
    status: 'pending' | 'loading' | 'completed' | 'error';
    result?: CheckResult;
  }>;
}) {
  // Group countries by region
  const countryByRegion = countries.reduce((acc, country) => {
    if (!acc[country.region]) {
      acc[country.region] = [];
    }
    acc[country.region].push(country);
    return acc;
  }, {} as Record<string, typeof countries>);

  const regions = Object.keys(countryByRegion).sort((a, b) => a.localeCompare(b));

  return (
    <>
      {regions.map(region => (
        <Box key={region} mb="lg">
          <Title order={5} fw={700} mb="xs">
            {region} ({countryByRegion[region].length})
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
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

export default function StreamingResults({ url, countries }: StreamingResultsProps) {
  const {
    isStreaming,
    totalCountries,
    completedCountries,
    countries: countryStates,
    error,
    startStreaming,
    progress,
  } = useStreamingCheck();

  useEffect(() => {
    startStreaming(url, countries);

    return () => {
      // Cleanup handled by the hook itself
    };
  }, [url, countries, startStreaming]);

  const successfulCount = countryStates.filter(
    c => c.status === 'completed' && c.result?.accessible
  ).length;

  const errorCount = countryStates.filter(
    c => c.status === 'completed' && !c.result?.accessible
  ).length;

  const avgResponseTime = countryStates
    .filter(c => c.result?.accessible)
    .reduce((sum, c) => sum + (c.result?.responseTime || 0), 0) /
    Math.max(1, successfulCount);

  return (
    <Container size="lg" py="md">
      {error ? (
        <Alert color="red" title="Error" mb="md">
          {error}
        </Alert>
      ) : (
        <>
          <Box
            p="md"
            mb="md"
            bg="dark.8"
            style={{
              borderRadius: 12,
              border: '1px dashed var(--mantine-color-dark-5) !important',
            }}
          >
            <Title order={4} mb="md">
              {url}
            </Title>

            {isStreaming && (
              <Box mb="md">
                <Group justify="space-between" mb="xs">
                  <Text size="sm">
                    Progress: {completedCountries} / {totalCountries} countries
                  </Text>
                  <Text size="sm">{Math.round(progress * 100)}%</Text>
                </Group>
                <Progress value={progress * 100} animated />
              </Box>
            )}

            <Group gap="sm">
              <Badge color="green" variant="light">
                Success: {successfulCount}
              </Badge>
              <Badge color="red" variant="light">
                Failed: {errorCount}
              </Badge>
              {successfulCount > 0 && (
                <Badge color="blue" variant="light">
                  Avg time: {Math.round(avgResponseTime)}ms
                </Badge>
              )}
              <Badge color="gray" variant="light">
                Total: {totalCountries} countries
              </Badge>
            </Group>


          </Box>

          <Box
            p="md"
            bg="dark.8"
            style={{
              borderRadius: 12,
              border: '1px dashed var(--mantine-color-dark-5) !important',
            }}
          >
            {countryStates.length > 0 ? (
              <ResultsGrid countries={countryStates} />
            ) : (
              <Group justify="center" p="xl">
                <Loader size="lg" />
                <Text>Initializing check...</Text>
              </Group>
            )}
          </Box>
        </>
      )}
    </Container>
  );
}

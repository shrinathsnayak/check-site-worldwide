'use client';

import { useEffect } from 'react';
import { useQueryState, parseAsStringEnum } from 'nuqs';
import {
  Container,
  Title,
  Alert,
  Group,
  Box,
  Badge,
  Text,
  Loader,
  SegmentedControl,
} from '@mantine/core';
import { IconCheck, IconGrid3x3, IconTable } from '@tabler/icons-react';
import { useStreamingCheck } from '@/hooks/useStreamingCheck';
import ResultsTable from './ResultsTable';
import ResultsGrid from './ResultsGrid';
import { calculateCountryStats } from '@/utils/country-status-utils';

import type { StreamingResultsProps } from '@/types/component-types';

export default function StreamingResults({
  url,
  countries,
}: StreamingResultsProps) {
  // Use nuqs for URL parameter management
  const [viewMode, setViewMode] = useQueryState(
    'view',
    parseAsStringEnum(['grid', 'table']).withDefault('grid')
  );

  const {
    isStreaming,
    totalCountries,
    countries: countryStates,
    error,
    startStreaming,
  } = useStreamingCheck();

  useEffect(() => {
    startStreaming(url, countries);

    return () => {
      // Cleanup handled by the hook itself
    };
  }, [url, countries, startStreaming]);

  const { successfulCount, errorCount, avgResponseTime } =
    calculateCountryStats(countryStates);

  return (
    <Container size='lg' py='md'>
      {error ? (
        <Alert color='red' title='Error' mb='md'>
          {error}
        </Alert>
      ) : (
        <>
          <Box
            p='md'
            mb='md'
            bg='dark.8'
            style={{
              borderRadius: 12,
              border: '1px dashed var(--mantine-color-dark-5) !important',
            }}
          >
            <Group align='center' mb='md' gap={10}>
              {isStreaming ? (
                <Loader size='xs' color='red' />
              ) : (
                <IconCheck size={24} color='var(--mantine-color-green-6)' />
              )}
              <Title order={4}>{url}</Title>
            </Group>

            <Group gap='sm'>
              <Badge color='green' variant='light'>
                Success: {successfulCount}
              </Badge>
              <Badge color='red' variant='light'>
                Failed: {errorCount}
              </Badge>
              {successfulCount > 0 && (
                <Badge color='blue' variant='light'>
                  Avg time: {Math.round(avgResponseTime)}ms
                </Badge>
              )}
              <Badge color='gray' variant='light'>
                Total: {totalCountries} countries
              </Badge>
            </Group>
          </Box>

          <Box
            p='md'
            bg='dark.8'
            style={{
              borderRadius: 12,
              border: '1px dashed var(--mantine-color-dark-5) !important',
            }}
          >
            {countryStates.length > 0 ? (
              <>
                <Group justify='space-between' mb='md'>
                  <Text size='lg' fw={600}>
                    Results
                  </Text>
                  <div>
                    <SegmentedControl
                      size='md'
                      color='red'
                      value={viewMode}
                      onChange={value => setViewMode(value as 'grid' | 'table')}
                      data={[
                        {
                          label: (
                            <Group gap={6} wrap='nowrap'>
                              <IconGrid3x3 size={14} />
                              <Text size='sm'>Grid</Text>
                            </Group>
                          ),
                          value: 'grid',
                        },
                        {
                          label: (
                            <Group gap={6} wrap='nowrap'>
                              <IconTable size={14} />
                              <Text size='sm'>Table</Text>
                            </Group>
                          ),
                          value: 'table',
                        },
                      ]}
                    />
                  </div>
                </Group>

                {viewMode === 'grid' ? (
                  <ResultsGrid countries={countryStates} />
                ) : (
                  <ResultsTable countries={countryStates} />
                )}
              </>
            ) : (
              <Group justify='center' p='xl'>
                <Loader size='lg' />
                <Text>Initializing check...</Text>
              </Group>
            )}
          </Box>
        </>
      )}
    </Container>
  );
}

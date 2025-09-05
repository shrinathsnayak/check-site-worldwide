'use client';

import { Group, Box, Badge, Text, Space, Loader } from '@mantine/core';
import { IconCheck, IconX, IconClock } from '@tabler/icons-react';
import type { CheckResult } from '@/types/types';
import {
  getCountryFlagFromISOCode,
  millisecondsToSeconds,
} from '@/utils/utils';
import {
  getStatusColor,
  getStatusText,
  getCardBackgroundColor,
  getCardBorderColor,
  type CountryStatus,
} from '@/utils/country-status-utils';

import type { CountryCardProps } from '@/types/component-types';

function getStatusIcon(status: CountryStatus, result?: CheckResult) {
  switch (status) {
    case 'completed':
      return result?.accessible ? <IconCheck size={16} /> : <IconX size={16} />;
    case 'error':
      return <IconX size={16} />;
    case 'loading':
      return <Loader size={16} />;
    default:
      return <IconClock size={16} />;
  }
}

export default function CountryCard({
  country,
  status,
  result,
}: CountryCardProps) {
  return (
    <Box
      p='md'
      style={{
        backgroundColor: getCardBackgroundColor(status, result),
        borderRadius: 12,
        border: getCardBorderColor(status, result),
      }}
    >
      <Group justify='space-between' mb={6} wrap='nowrap'>
        <Group gap={8} wrap='nowrap'>
          <Text size='xl' style={{ lineHeight: 1 }}>
            {getCountryFlagFromISOCode(country.code)}
          </Text>
          <Text fw={600}>{country.name}</Text>
        </Group>
        <Badge color={getStatusColor(status, result)} variant='light'>
          <Group gap={4} wrap='nowrap'>
            {getStatusIcon(status, result)}
            {getStatusText(status, result)}
          </Group>
        </Badge>
      </Group>
      <Space h={6} />
      {status === 'completed' && result?.accessible ? (
        <>
          <Group gap='md' mb='xs'>
            <Text size='sm'>
              Total: {millisecondsToSeconds(result.responseTime)}s
            </Text>
            <Text size='sm'>IP: {result.usedIp}</Text>
          </Group>
          {result.timings && (
            <Group gap='xs' wrap='wrap'>
              <Text size='xs' c='dimmed'>
                DNS: {result.timings.dnsFetch}ms
              </Text>
              <Text size='xs' c='dimmed'>
                Connect: {result.timings.connect}ms
              </Text>
              <Text size='xs' c='dimmed'>
                TLS: {result.timings.tls}ms
              </Text>
              <Text size='xs' c='dimmed'>
                TTFB: {result.timings.ttfb}ms
              </Text>
              <Text size='xs' c='dimmed'>
                Transfer: {result.timings.transfer}ms
              </Text>
              <Text size='xs' c='dimmed'>
                Latency: {result.timings.latency}ms
              </Text>
            </Group>
          )}
        </>
      ) : status === 'completed' && result ? (
        <Text size='sm'>{result.error ?? 'Unknown error'}</Text>
      ) : status === 'loading' ? (
        <Text size='sm' c='blue'>
          Checking accessibility...
        </Text>
      ) : (
        <Text size='sm' c='gray'>
          Waiting to start...
        </Text>
      )}
    </Box>
  );
}

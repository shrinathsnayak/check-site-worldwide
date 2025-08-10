import {
  SimpleGrid,
  Group,
  Box,
  Badge,
  Text,
  Space,
  Title,
} from '@mantine/core';
import type { CheckResult } from '@/types/types';
import {
  getCountryFlagFromISOCode,
  millisecondsToSeconds,
} from '@/utils/utils';

function ResultsGrid({ results }: { results: CheckResult[] }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing='sm'>
      {results.map(r => {
        const isSuccess = r.accessible;
        const bg = isSuccess ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
        const border = isSuccess
          ? '1px solid rgba(34,197,94,0.25)'
          : '1px solid rgba(239,68,68,0.25)';
        return (
          <Box
            key={`${r.country}-${r.timestamp}`}
            p='md'
            style={{
              backgroundColor: bg,
              borderRadius: 12,
              border,
            }}
          >
            <Group justify='space-between' mb={6} wrap='nowrap'>
              <Group gap={8} wrap='nowrap'>
                <Text size='xl' style={{ lineHeight: 1 }}>
                  {getCountryFlagFromISOCode(r.country)}
                </Text>
                <Text fw={600}>{r.countryName}</Text>
              </Group>
              <Badge color={isSuccess ? 'green' : 'red'} variant='light'>
                {isSuccess ? 'Accessible' : 'Inaccessible'}
              </Badge>
            </Group>
            <Space h={6} />
            {isSuccess ? (
              <Group gap='md'>
                <Text size='sm'>
                  Time: {millisecondsToSeconds(r.responseTime)}s
                </Text>
                <Text size='sm'>IP: {r.usedIp}</Text>
              </Group>
            ) : (
              <Text size='sm'>{r.error ?? 'Unknown error'}</Text>
            )}
          </Box>
        );
      })}
    </SimpleGrid>
  );
}

export default function ResultsByRegion({
  resultsByRegion,
}: {
  resultsByRegion: Record<string, CheckResult[]>;
}) {
  const regions = Object.keys(resultsByRegion).sort((a, b) =>
    a.localeCompare(b)
  );
  return (
    <>
      {regions.map(region => (
        <Box key={region} mb='lg'>
          <Title order={5} fw={700} mb='xs'>
            {region} ({resultsByRegion[region].length})
          </Title>
          <ResultsGrid results={resultsByRegion[region]} />
        </Box>
      ))}
    </>
  );
}

import { Container, Title, Alert, Group, Badge, Box } from '@mantine/core';
import type { CheckResponse } from '@/types/types';
import PageLayout from '@/components/shared/PageLayout';
import { validateUrl } from '@/validation/validation';
import ResultsByRegion from '@/components/results/ResultsByRegion';
import { getCheckResults } from '@/actions/actions';

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{
    url?: string;
    countries?: string;
    timeout?: string;
    mock?: string;
  }>;
}) {
  const sp = await searchParams;
  const urlParam = sp.url ?? '';
  const countriesParam = sp.countries ?? '';
  const timeoutParam = sp.timeout ?? '';
  const mockParam = sp.mock ?? '';
  const modeParam = (sp as any).mode ?? '';

  if (!urlParam || !validateUrl(urlParam)) {
    return (
      <PageLayout>
        <Container size='lg' py='md'>
          <Alert color='red' title='Error'>
            Missing or invalid url parameter
          </Alert>
        </Container>
      </PageLayout>
    );
  }

  let data: CheckResponse | null = null;
  let errorMessage: string | null = null;

  try {
    data = await getCheckResults({
      url: urlParam,
      countries: countriesParam,
      timeout: timeoutParam,
      mock: mockParam,
      mode: modeParam === 'quick' ? 'quick' : undefined,
    });
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : 'Unknown error';
  }

  return (
    <PageLayout>
      <Container size='lg' py='md'>
        {errorMessage ? (
          <Alert color='red' title='Error'>
            {errorMessage}
          </Alert>
        ) : data ? (
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
              <Title order={4} mb='md'>
                {urlParam}
              </Title>
              <Group gap='sm'>
                <Badge color='green' variant='light'>
                  Success rate: {data.summary.successRate.toFixed(1)}%
                </Badge>
                <Badge color='blue' variant='light'>
                  Avg time: {Math.round(data.summary.avgResponseTime)}ms
                </Badge>
                <Badge color='gray' variant='light'>
                  {data.summary.accessible}/{data.summary.total} accessible
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
              <ResultsByRegion resultsByRegion={data.resultsByRegion} />
            </Box>
          </>
        ) : null}
      </Container>
    </PageLayout>
  );
}

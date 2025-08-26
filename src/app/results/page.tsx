import { Container, Alert } from '@mantine/core';
import PageLayout from '@/components/shared/PageLayout';
import { validateUrl } from '@/validation/validation';
import StreamingResults from '@/components/results/StreamingResults';

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{
    url?: string;
    countries?: string;
  }>;
}) {
  const sp = await searchParams;
  const urlParam = sp.url ?? '';
  const countriesParam = sp.countries ?? '';

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

  // Always use streaming for all requests
  const countriesArray = countriesParam ? countriesParam.split(',') : undefined;

  return (
    <PageLayout>
      <StreamingResults url={urlParam} countries={countriesArray} />
    </PageLayout>
  );
}

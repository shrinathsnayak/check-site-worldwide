import { Container, Text, Space, Center, Flex } from '@mantine/core';
import { IconWorld } from '@tabler/icons-react';
import PageLayout from '@/components/shared/PageLayout';

export default function Loading() {
  return (
    <PageLayout>
      <Center>
        <Container size='lg' py='xl'>
          <Space h='xl' />
          <Flex gap='sm' align='center' direction='column'>
            <IconWorld size={50} color='var(--mantine-color-red-5)' />
            <Text c='dimmed' ta='center'>
              Running checks across multiple countries. This can take up to 30
              seconds depending on network conditions.
            </Text>
          </Flex>
          <Text size='sm' c='dimmed' ta='center' mt={10}>
            Tip: You can keep this tab open. We’ll show results as soon as
            they’re ready.
          </Text>
        </Container>
      </Center>
    </PageLayout>
  );
}

import { Flex, rem } from '@mantine/core';
import PageLayout from '@/components/shared/PageLayout';
import Header from '@/components/Hero/Header';
import Features from '@/components/Features';
import Form from '@/components/Form';

export default function Home() {
  return (
    <PageLayout>
      <Flex
        direction='column'
        gap={{ base: rem(50), sm: rem(70) }}
        px={{ base: 24, sm: 0 }}
        py={{ base: 'sm', sm: 'xl' }}
      >
        <Header />
        <Form />
        <Features />
      </Flex>
    </PageLayout>
  );
}

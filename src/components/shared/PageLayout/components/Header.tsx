import React from 'react';
import Link from 'next/link';
import { Anchor, AppShell, Container, Flex, Title } from '@mantine/core';

const Header = () => {
  return (
    <AppShell.Header
      bg='dark.9'
      withBorder={true}
      style={{
        borderBottom: '1px dashed var(--mantine-color-dark-4) !important',
      }}
    >
      <Container
        size='lg'
        style={{
          paddingInline: '0 !important',
          borderLeft: '1px dashed var(--mantine-color-dark-5) !important',
          borderRight: '1px dashed var(--mantine-color-dark-5) !important',
        }}
      >
        <Anchor
          prefetch
          component={Link}
          href='/'
          underline='never'
          w='min-content'
        >
          <Flex align='center' justify='center' py='md' gap={10}>
            <Title order={3} c='white'>
              checksiteworldwide.com
            </Title>
          </Flex>
        </Anchor>
      </Container>
    </AppShell.Header>
  );
};

export default Header;

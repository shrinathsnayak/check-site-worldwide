import React from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Anchor, AppShell, Container, Flex, Image, Title } from '@mantine/core';
// import { PUBLIC_IMAGES } from "@/constants";

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
            {/* <Image
              width={30}
              height={30}
              radius="sm"
              priority={true}
              component={NextImage}
              src={PUBLIC_IMAGES.FAVICON}
              alt="validate.email logo"
            /> */}
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

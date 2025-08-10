'use client';

import dynamic from 'next/dynamic';
import { AppShell, Container } from '@mantine/core';

const Footer = dynamic(() => import('./components/Footer'));
const Header = dynamic(() => import('./components/Header'));

const PageLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppShell
      layout='alt'
      header={{ height: 62 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { desktop: true },
      }}
    >
      <Header />
      <AppShell.Main bg='dark.9'>
        <Container
          px={0}
          size='lg'
          mih='100vh'
          style={{
            borderLeft: '1px dashed var(--mantine-color-dark-5) !important',
            borderRight: '1px dashed var(--mantine-color-dark-5) !important',
          }}
        >
          {children}
        </Container>
      </AppShell.Main>
      <Footer />
    </AppShell>
  );
};

PageLayout.displayName = 'PageLayout';

export default PageLayout;

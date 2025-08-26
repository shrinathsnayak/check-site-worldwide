'use client';

import dynamic from 'next/dynamic';
import { AppShell, Container } from '@mantine/core';
import { appShellConfig, containerStyles, backgroundColors } from '@/utils/layout-utils';

const Footer = dynamic(() => import('./components/Footer'));
const Header = dynamic(() => import('./components/Header'));

import type { PageLayoutProps } from '@/types/component-types';

const PageLayout = ({ children }: PageLayoutProps) => {
  return (
    <AppShell
      layout={appShellConfig.layout}
      header={appShellConfig.header}
      navbar={appShellConfig.navbar}
    >
      <Header />
      <AppShell.Main bg={backgroundColors.dark9}>
        <Container
          px={0}
          size='lg'
          mih='100vh'
          style={containerStyles}
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

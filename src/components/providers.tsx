'use client';

import { MantineProvider } from '@mantine/core';
import theme from '@/styles/theme';

import type { ProvidersProps } from '@/types/component-types';

export function Providers({ children }: ProvidersProps) {
  return (
    <MantineProvider
      theme={theme}
      forceColorScheme='dark'
      defaultColorScheme='dark'
    >
      {children}
    </MantineProvider>
  );
}

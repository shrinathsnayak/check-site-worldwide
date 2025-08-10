import '@mantine/core/styles.css';
import '@/styles/global.css';

import type { Metadata } from 'next';
import { ColorSchemeScript } from '@mantine/core';
import { Providers } from '../components/providers';
import { METADATA } from '@/constants/metadata';

export const metadata: Metadata = METADATA;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' data-mantine-color-scheme='dark'>
      <head>
        <link rel='icon' href='/favicon.ico' sizes='any' />
        <link rel='icon' href='/favicon.svg' type='image/svg+xml' />
        <link rel='apple-touch-icon' href='/apple-touch-icon.png' />
        <link rel='manifest' href='/manifest.json' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
        <meta name='theme-color' content='#000000' />
        <meta name='color-scheme' content='light dark' />
        <ColorSchemeScript defaultColorScheme='dark' forceColorScheme='dark' />
        <script
          defer
          data-domain='checksiteworldwide.com'
          src='https://plausible-analytics-ce-production-8993.up.railway.app/js/script.hash.outbound-links.pageview-props.tagged-events.js'
        ></script>
      </head>
      <body suppressHydrationWarning={true} className='root'>
        <Providers>{children}</Providers>
        <script
          data-name='BMC-Widget'
          data-cfasync='false'
          src='https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js'
          data-id='kickstart.sh'
          data-description='Support me on Buy me a coffee!'
          data-color='#e03131'
          data-position='Right'
          data-x_margin='18'
          data-y_margin='18'
          async
        ></script>
      </body>
    </html>
  );
}

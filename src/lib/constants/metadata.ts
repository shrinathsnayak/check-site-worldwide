import type { Metadata } from 'next';

// Base URL configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://checksiteworldwide.com';

// Site information
export const SITE_INFO = {
  name: 'Check Site Worldwide',
  description: 'Check if your website is accessible from different countries around the world. Test website availability, response times, and accessibility using our global proxy network.',
  url: BASE_URL,
  author: 'Check Site Worldwide Team',
  creator: 'Check Site Worldwide',
  publisher: 'Check Site Worldwide',
  category: 'technology',
  classification: 'website testing tool',
} as const;

// SEO keywords
export const SEO_KEYWORDS = [
  'website accessibility',
  'website availability',
  'global website testing',
  'website monitoring',
  'proxy testing',
  'international website check',
  'website performance',
  'geographic accessibility',
  'website uptime',
  'global connectivity test',
] as const;

// Social media configuration
export const SOCIAL_CONFIG = {
  twitter: {
    handle: '@iswebsiteaccessible',
    site: '@iswebsiteaccessible',
  },
  og: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_INFO.name,
  },
} as const;

// Image configuration
export const IMAGE_CONFIG = {
  og: {
    url: `${BASE_URL}/og-image.png`,
    width: 1200,
    height: 630,
    alt: 'Check Site Worldwide - Global Website Testing Tool',
  },
  favicon: {
    ico: '/favicon.ico',
    svg: '/favicon.svg',
    appleTouch: '/apple-touch-icon.png',
  },
} as const;

// Verification codes (replace with actual codes in production)
export const VERIFICATION_CODES = {
  google: 'your-google-verification-code',
  yandex: 'your-yandex-verification-code',
  yahoo: 'your-yahoo-verification-code',
} as const;

// PWA configuration
export const PWA_CONFIG = {
  name: SITE_INFO.name,
  shortName: SITE_INFO.name,
  description: SITE_INFO.description,
  startUrl: '/',
  display: 'standalone',
  backgroundColor: '#ffffff',
  themeColor: '#000000',
  orientation: 'portrait-primary',
  scope: '/',
  lang: 'en',
  dir: 'ltr',
  categories: ['utilities', 'productivity', 'developer'],
} as const;

// Main metadata configuration
export const metadata: Metadata = {
  title: {
    default: `${SITE_INFO.name} - Check Website Availability from Multiple Countries`,
    template: `%s | ${SITE_INFO.name}`,
  },
  description: SITE_INFO.description,
  keywords: [...SEO_KEYWORDS],
  authors: [{ name: SITE_INFO.author }],
  creator: SITE_INFO.creator,
  publisher: SITE_INFO.publisher,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: SOCIAL_CONFIG.og.type,
    locale: SOCIAL_CONFIG.og.locale,
    url: SITE_INFO.url,
    siteName: SOCIAL_CONFIG.og.siteName,
    title: `${SITE_INFO.name} - Check Website Availability from Multiple Countries`,
    description: SITE_INFO.description,
    images: [
      {
        url: IMAGE_CONFIG.og.url,
        width: IMAGE_CONFIG.og.width,
        height: IMAGE_CONFIG.og.height,
        alt: IMAGE_CONFIG.og.alt,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_INFO.name} - Check Website Availability from Multiple Countries`,
    description: SITE_INFO.description,
    images: [IMAGE_CONFIG.og.url],
    creator: SOCIAL_CONFIG.twitter.handle,
    site: SOCIAL_CONFIG.twitter.site,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: VERIFICATION_CODES.google,
    yandex: VERIFICATION_CODES.yandex,
    yahoo: VERIFICATION_CODES.yahoo,
  },
  category: SITE_INFO.category,
  classification: SITE_INFO.classification,
  other: {
    'application-name': SITE_INFO.name,
    'apple-mobile-web-app-title': SITE_INFO.name,
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#000000',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#000000',
    'color-scheme': 'light dark',
  },
};

// Head tags configuration
export const HEAD_TAGS = {
  favicon: [
    { rel: 'icon', href: IMAGE_CONFIG.favicon.ico, sizes: 'any' },
    { rel: 'icon', href: IMAGE_CONFIG.favicon.svg, type: 'image/svg+xml' },
    { rel: 'apple-touch-icon', href: IMAGE_CONFIG.favicon.appleTouch },
  ],
  manifest: [{ rel: 'manifest', href: '/manifest.json' }],
  viewport: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'theme-color', content: '#000000' },
    { name: 'color-scheme', content: 'light dark' },
  ],
} as const;

// Sitemap configuration
export const SITEMAP_CONFIG = {
  baseUrl: BASE_URL,
  pages: [
    {
      path: '/',
      lastmod: '2024-01-01',
      changefreq: 'weekly',
      priority: 1.0,
    },
    {
      path: '/api/check',
      lastmod: '2024-01-01',
      changefreq: 'monthly',
      priority: 0.8,
    },
    {
      path: '/api/countries',
      lastmod: '2024-01-01',
      changefreq: 'monthly',
      priority: 0.7,
    },
  ],
} as const;

// Robots.txt configuration
export const ROBOTS_CONFIG = {
  userAgent: '*',
  allow: ['/'],
  disallow: ['/api/', '/_next/', '/admin/'],
  sitemap: `${BASE_URL}/sitemap.xml`,
  crawlDelay: 1,
} as const;

// Browser config for Windows tiles
export const BROWSER_CONFIG = {
  msapplication: {
    tile: {
      square150x150logo: '/mstile-150x150.png',
      TileColor: '#000000',
    },
  },
} as const;

import type { Metadata } from 'next';

// Base URL configuration
const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://checksiteworldwide.com';

// Site information
export const SITE_INFO = {
  name: 'Check Site Worldwide',
  description:
    'Check if your website is accessible from different countries around the world. Test website availability, response times, and accessibility from multiple geographic locations.',
  url: BASE_URL,
  author: 'Check Site Worldwide',
  creator: 'Check Site Worldwide',
  publisher: 'Check Site Worldwide',
  category: 'Web Tools',
  classification: 'Web Accessibility Tool',
} as const;

// SEO keywords
export const SEO_KEYWORDS = [
  'website accessibility',
  'website availability',
  'website testing',
  'global website check',
  'website monitoring',
  'website accessibility test',
  'check website from different countries',
  'website availability checker',
  'global website accessibility',
  'website accessibility tool',
  'website accessibility checker',
  'website accessibility test tool',
  'website accessibility monitoring',
  'website accessibility checker tool',
  'website accessibility test online',
  'website accessibility checker online',
  'website accessibility test free',
  'website accessibility checker free',
  'website accessibility test tool online',
  'website accessibility checker tool online',
] as const;

// Social media configuration
export const SOCIAL_CONFIG = {
  og: {
    type: 'website',
    locale: 'en_US',
    siteName: SITE_INFO.name,
  },
  twitter: {
    handle: '@checksiteworldwide',
    site: '@checksiteworldwide',
    cardType: 'summary_large_image',
  },
} as const;

// Image configuration
export const IMAGE_CONFIG = {
  og: {
    url: `${BASE_URL}/og-image.png`,
    width: 1200,
    height: 630,
    alt: 'Check Site Worldwide - Website Accessibility Testing Tool',
  },
  favicon: {
    ico: '/favicon.ico',
    svg: '/favicon.svg',
    appleTouch: '/apple-touch-icon.png',
  },
} as const;

// Verification codes
export const VERIFICATION_CODES = {
  google: 'google-site-verification-code',
  yandex: 'yandex-verification-code',
  yahoo: 'yahoo-verification-code',
} as const;

// PWA configuration
export const PWA_CONFIG = {
  name: SITE_INFO.name,
  shortName: SITE_INFO.name,
  description: SITE_INFO.description,
  themeColor: '#000000',
  backgroundColor: '#ffffff',
  display: 'standalone',
  startUrl: '/',
  scope: '/',
} as const;

// Main metadata object
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
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
    card: SOCIAL_CONFIG.twitter.cardType,
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
  other: {
    category: SITE_INFO.category,
    classification: SITE_INFO.classification,
    'application-name': SITE_INFO.name,
    'apple-mobile-web-app-title': SITE_INFO.name,
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#000000',
    'msapplication-config': '/browserconfig.xml',
    'theme-color': '#000000',
  },
};

// Sitemap configuration
export const SITEMAP_CONFIG = {
  baseUrl: BASE_URL,
  pages: [
    { path: '/', priority: 1.0, changefreq: 'daily' },
    { path: '/api/check', priority: 0.8, changefreq: 'weekly' },
    { path: '/api/countries', priority: 0.8, changefreq: 'weekly' },
  ],
} as const;

// Robots configuration
export const ROBOTS_CONFIG = {
  userAgent: '*',
  allow: ['/'],
  disallow: ['/api/*'],
  sitemap: `${BASE_URL}/sitemap.xml`,
  host: BASE_URL,
} as const;

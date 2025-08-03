import { ROBOTS_CONFIG } from '@/lib/constants/metadata';

export default function robots() {
  const currentDate = new Date().toISOString().split('T')[0];

  return {
    rules: [
      {
        userAgent: ROBOTS_CONFIG.userAgent,
        allow: ROBOTS_CONFIG.allow,
        disallow: ROBOTS_CONFIG.disallow,
      },
    ],
    sitemap: ROBOTS_CONFIG.sitemap,
    host: ROBOTS_CONFIG.sitemap.replace('/sitemap.xml', ''),
    // Add custom headers for build date
    headers: {
      'X-Generated-Date': currentDate,
      'X-Build-Timestamp': new Date().toISOString(),
    },
  };
}

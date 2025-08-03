import { SITEMAP_CONFIG } from '@/constants/metadata';

export default function sitemap() {
  const currentDate = new Date();

  return SITEMAP_CONFIG.pages.map(page => ({
    url: `${SITEMAP_CONFIG.baseUrl}${page.path}`,
    lastModified: currentDate,
    changeFrequency: page.changefreq as
      | 'always'
      | 'hourly'
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'yearly'
      | 'never',
    priority: page.priority,
  }));
}

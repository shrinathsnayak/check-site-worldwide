// Webshare API integration for fetching real proxy lists
import { PAID_PROXY_CONFIG } from '@/constants/constants';
import type { PaidProxy, WebshareApiResponse } from '@/types/types';
import { getCountryByCode } from '@/utils/countries';
import { logProxyProcessing } from '@/utils/utils';
import { proxyCache } from '@/cache/cache';
import { info, error, debug } from '@/utils/logger';
import { isValidProxy } from '@/validation/validation';

// Function to fetch real proxy list from Webshare API with pagination
export async function fetchWebshareProxies(
  countries: string[] = []
): Promise<PaidProxy[]> {
  // Check cache first
  const cachedData = proxyCache.get(countries);
  if (cachedData) {
    return cachedData;
  }

  try {
    info('🔍 Fetching proxy list from Webshare API...', 'webshare-api');

    const allProxies: PaidProxy[] = [];
    const countryProxyCount = new Map<string, number>();
    let page = 1;
    const pageSize = 100; // Increased from 25 to 100 for better efficiency
    let hasMorePages = true;

    while (hasMorePages) {
      // Build query parameters for current page
      const params = new URLSearchParams({
        mode: 'direct',
        page: page.toString(),
        page_size: pageSize.toString(),
        valid: 'true',
      });

      // Add country filter if specified
      if (countries.length > 0) {
        params.append('country_code__in', countries.join(','));
      }

      // Webshare API endpoint with query parameters
      const apiUrl = `${PAID_PROXY_CONFIG.baseUrl}/proxy/list/?${params.toString()}`;

      debug(
        `📄 Fetching page ${page} with ${pageSize} proxies...`,
        'webshare-api'
      );

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Authorization: `Token ${PAID_PROXY_CONFIG.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorMsg = `Webshare API error: ${response.status} ${response.statusText}`;
        error(errorMsg, 'webshare-api');
        throw new Error(errorMsg);
      }

      const data: WebshareApiResponse = await response.json();

      debug(
        `📄 Page ${page}: Received ${data.results.length} proxies (total: ${data.count})`,
        'webshare-api'
      );

      // Convert Webshare proxies to our format with validation
      for (const webshareProxy of data.results) {
        // Validate proxy data
        if (!isValidProxy(webshareProxy)) {
          debug(
            `⚠️ Skipping invalid proxy: ${webshareProxy.proxy_address}`,
            'webshare-api'
          );
          continue;
        }

        const countryInfo = getCountryByCode(webshareProxy.country_code);
        if (countryInfo) {
          // Check if we already have enough proxies for this country
          const currentCount =
            countryProxyCount.get(webshareProxy.country_code) || 0;
          const maxProxiesPerCountry = 3; // Allow up to 3 proxies per country

          if (currentCount >= maxProxiesPerCountry) {
            continue; // Skip if we already have enough proxies for this country
          }

          const proxy: PaidProxy = {
            host: webshareProxy.proxy_address,
            port: webshareProxy.port,
            country: webshareProxy.country_code,
            region: countryInfo.region,
            protocol: 'https',
            anonymity: 'elite',
            lastChecked: new Date().toISOString(),
            uptime: 95, // Webshare proxies are generally reliable
            username: webshareProxy.username,
            password: webshareProxy.password,
          };

          allProxies.push(proxy);
          countryProxyCount.set(webshareProxy.country_code, currentCount + 1);

          debug(
            `✅ Added proxy for ${webshareProxy.country_code}: ${webshareProxy.proxy_address}:${webshareProxy.port} (${currentCount + 1}/${maxProxiesPerCountry})`,
            'webshare-api'
          );
        }
      }

      // Check if we have more pages and if we need more proxies
      hasMorePages = data.next !== null && data.results.length > 0;

      // Stop if we have enough proxies for all requested countries
      if (countries.length > 0) {
        const hasEnoughProxies = countries.every(country => {
          const count = countryProxyCount.get(country) || 0;
          return count >= 1; // At least 1 proxy per country
        });

        if (hasEnoughProxies) {
          debug(
            '✅ Have enough proxies for all requested countries, stopping pagination',
            'webshare-api'
          );
          hasMorePages = false;
        }
      }

      page++;

      // Safety check to prevent infinite loops
      if (page > 10) {
        debug(
          '⚠️ Reached maximum page limit (10), stopping pagination',
          'webshare-api'
        );
        hasMorePages = false;
      }
    }

    logProxyProcessing(
      countries,
      allProxies.length,
      'Fetched proxies from API'
    );

    logProxyProcessing(countries, allProxies.length, 'Generated valid proxies');

    // Cache the results
    proxyCache.set(countries, allProxies);

    return allProxies;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    error(
      `❌ Failed to fetch from Webshare API: ${errorMessage}`,
      'webshare-api'
    );
    return [];
  }
}

// Function to get working proxy hostnames from Webshare
export async function getWorkingWebshareProxies(
  countries: string[]
): Promise<PaidProxy[]> {
  const proxies = await fetchWebshareProxies(countries);

  if (proxies.length === 0) {
    logProxyProcessing(countries, 0, 'No proxies available');
    return [];
  }

  logProxyProcessing(countries, proxies.length, 'Found working proxies');
  return proxies;
}

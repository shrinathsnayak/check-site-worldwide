// Webshare API integration for fetching real proxy lists
import { PAID_PROXY_CONFIG } from '@/constants/constants';
import type { PaidProxy, WebshareApiResponse } from '@/types/types';
import { getCountryByCode } from '@/utils/countries';
import { logProxyProcessing } from '@/utils/utils';
import { proxyCache } from '@/cache/cache';
import { info, error, debug } from '@/utils/logger';
import { isValidProxy } from '@/validation/validation';

// Function to fetch real proxy list from Webshare API
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

    // Build query parameters
    const params = new URLSearchParams({
      mode: 'direct',
      page: '1',
      page_size: '25',
      valid: 'true',
    });

    // Add country filter if specified
    if (countries.length > 0) {
      params.append('country_code__in', countries.join(','));
    }

    // Webshare API endpoint with query parameters
    const apiUrl = `${PAID_PROXY_CONFIG.baseUrl}/proxy/list/?${params.toString()}`;

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
    logProxyProcessing(
      countries,
      data.results.length,
      'Fetched proxies from API'
    );

    // Convert Webshare proxies to our format with validation
    const proxies: PaidProxy[] = [];
    const countryProxyCount = new Map<string, number>();

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
        // Check if we already have a proxy for this country
        const currentCount =
          countryProxyCount.get(webshareProxy.country_code) || 0;
        if (currentCount >= 1) {
          continue; // Skip if we already have one proxy for this country
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

        proxies.push(proxy);
        countryProxyCount.set(webshareProxy.country_code, currentCount + 1);

        info(
          `✅ Added proxy for ${webshareProxy.country_code}: ${webshareProxy.proxy_address}:${webshareProxy.port}`,
          'webshare-api'
        );
      }
    }

    logProxyProcessing(countries, proxies.length, 'Generated valid proxies');

    // Cache the results
    proxyCache.set(countries, proxies);

    return proxies;
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

import https from 'https';
import axios from 'axios';
import { PROXY_CONFIG } from '@/constants/constants';
import { PaidProxy } from '@/types/types';
import { ALL_COUNTRIES } from '@/utils/countries';
import { getWorkingWebshareProxies } from './webshare-api';
import {
  logProxyStatus,
  logProxyTesting,
  logBatchProcessing,
} from '@/utils/utils';
import { info, debug } from '@/utils/logger';

export async function getPaidProxies(
  countries: string[] = []
): Promise<PaidProxy[]> {
  try {
    info(
      `Fetching Webshare proxies for countries: ${countries.join(', ')}`,
      'paid-proxy-services'
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      PROXY_CONFIG.MAX_PROXY_SEARCH_TIME
    );

    // Use the Webshare API to get real proxy hostnames
    const targetCountries =
      countries.length > 0 ? countries : ALL_COUNTRIES.map(c => c.code);
    const proxies = await getWorkingWebshareProxies(targetCountries);

    clearTimeout(timeoutId);
    info(`Generated ${proxies.length} Webshare proxies`, 'paid-proxy-services');

    return proxies;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    debug(
      `Failed to fetch Webshare proxies: ${errorMessage}`,
      'paid-proxy-services'
    );
    return [];
  }
}

// Enhanced proxy testing for paid proxies (faster, more reliable)
export async function testPaidProxy(
  proxy: PaidProxy,
  timeout: number = PROXY_CONFIG.FAST_FAIL_TIMEOUT
): Promise<boolean> {
  const testUrl = 'http://httpbin.org/ip';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Use authentication if available
    const auth =
      proxy.username && proxy.password
        ? {
            username: proxy.username,
            password: proxy.password,
          }
        : undefined;

    // For Webshare proxies, we need to handle the authentication properly
    const proxyConfig = {
      host: proxy.host,
      port: proxy.port,
      protocol: 'http', // Explicitly set protocol to HTTP
      ...(auth && { auth }),
    };

    debug(
      `Testing proxy: ${proxy.host}:${proxy.port} with auth: ${!!auth}`,
      'paid-proxy-services'
    );

    const response = await axios.get(testUrl, {
      proxy: proxyConfig,
      timeout,
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        Connection: 'keep-alive',
      },
      // Use default SSL settings for better compatibility
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
      // Additional settings for proxy compatibility
      maxRedirects: 5,
      validateStatus: status => status < 500, // Accept any status < 500
    });

    clearTimeout(timeoutId);

    if (response.status === 200) {
      info(
        `✅ Paid proxy ${proxy.host}:${proxy.port} passed test`,
        'paid-proxy-services'
      );
      return true;
    } else if (response.status === 429) {
      debug(
        `⚠️  Paid proxy ${proxy.host}:${proxy.port} rate limited (429)`,
        'paid-proxy-services'
      );
      // Add delay for rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      return false;
    } else {
      debug(
        `⚠️  Paid proxy ${proxy.host}:${proxy.port} returned status ${response.status}`,
        'paid-proxy-services'
      );
      return false;
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    debug(
      `❌ Paid proxy ${proxy.host}:${proxy.port} failed test: ${errorMessage}`,
      'paid-proxy-services'
    );

    // Log more details for debugging
    if (errorMessage.includes('ENOTFOUND')) {
      debug(
        `   → DNS resolution failed for ${proxy.host}`,
        'paid-proxy-services'
      );
    } else if (errorMessage.includes('ECONNREFUSED')) {
      debug(
        `   → Connection refused to ${proxy.host}:${proxy.port}`,
        'paid-proxy-services'
      );
    } else if (errorMessage.includes('ETIMEDOUT')) {
      debug(
        `   → Connection timed out to ${proxy.host}:${proxy.port}`,
        'paid-proxy-services'
      );
    }
  }

  return false;
}

// Function to get working proxies for a specific country (paid proxies only)
export async function getWorkingProxiesForCountry(
  country: string,
  maxProxies: number = PROXY_CONFIG.MAX_PROXIES_PER_COUNTRY
): Promise<PaidProxy[]> {
  // Get paid proxies for this country
  const paidProxies = await getPaidProxies([country]);

  logProxyStatus(country, paidProxies.length);

  // Filter and sort by uptime/reliability
  const countryProxies = paidProxies
    .filter(proxy => proxy.country === country)
    .sort((a, b) => b.uptime - a.uptime)
    .slice(0, maxProxies);

  return countryProxies;
}

// Function to get all available proxies for a country (paid proxies only)
export async function getAllProxiesForCountry(
  country: string
): Promise<PaidProxy[]> {
  const paidProxies = await getPaidProxies([country]);

  // Remove duplicates and sort by reliability
  const uniqueProxies = paidProxies.filter(
    (proxy, index, self) =>
      index ===
      self.findIndex(p => p.host === proxy.host && p.port === proxy.port)
  );

  return uniqueProxies.sort((a, b) => b.uptime - a.uptime);
}

// Function to get a working proxy for a specific country (paid proxies only)
export async function getWorkingProxyForCountry(
  country: string
): Promise<string | null> {
  try {
    // Fetch paid proxies with timeout
    const proxies = await getWorkingProxiesForCountry(
      country,
      PROXY_CONFIG.MAX_PROXIES_PER_COUNTRY
    );

    if (proxies.length === 0) {
      logProxyStatus(country, 0);
      return null;
    }

    info(
      `Testing ${proxies.length} paid proxies for ${country}:`,
      'paid-proxy-services'
    );
    proxies.forEach((proxy, index) => {
      info(
        `  ${index + 1}. ${proxy.host}:${proxy.port} (uptime: ${proxy.uptime}%)`,
        'paid-proxy-services'
      );
    });

    // Test proxies in parallel batches for better performance
    const concurrencyLimit = PROXY_CONFIG.MAX_CONCURRENT_PROXY_TESTS;
    const workingProxies: PaidProxy[] = [];

    for (let i = 0; i < proxies.length; i += concurrencyLimit) {
      const batch = proxies.slice(i, i + concurrencyLimit);
      const batchIndex = Math.floor(i / concurrencyLimit) + 1;
      const totalBatches = Math.ceil(proxies.length / concurrencyLimit);
      logBatchProcessing(batchIndex, totalBatches, batch);

      const testPromises = batch.map(async (proxy, batchIndex) => {
        const globalIndex = i + batchIndex + 1;
        logProxyTesting(proxy, globalIndex, proxies.length, 'testing');
        const isWorking = await testPaidProxy(
          proxy,
          PROXY_CONFIG.FAST_FAIL_TIMEOUT
        );
        logProxyTesting(
          proxy,
          globalIndex,
          proxies.length,
          isWorking ? 'working' : 'failed'
        );
        return { proxy, isWorking };
      });

      const results = await Promise.allSettled(testPromises);

      // Process batch results
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.isWorking) {
          workingProxies.push(result.value.proxy);
          // Stop testing if we found enough working proxies
          if (workingProxies.length >= 3) {
            info(
              `Found ${workingProxies.length} working proxies, stopping tests`,
              'paid-proxy-services'
            );
            break;
          }
        }
      }

      // If we found enough working proxies, stop testing
      if (workingProxies.length >= 3) {
        break;
      }
    }

    if (workingProxies.length === 0) {
      logProxyStatus(country, proxies.length, false);
      return null;
    }

    // Sort by uptime and return the best proxy
    workingProxies.sort((a, b) => b.uptime - a.uptime);
    const bestProxy = workingProxies[0];
    logProxyStatus(country, proxies.length, true);
    info(
      `Found working paid proxy ${bestProxy.host}:${bestProxy.port} for ${country}`,
      'paid-proxy-services'
    );

    // Return proxy info as JSON string with authentication
    return JSON.stringify({
      host: bestProxy.host,
      port: bestProxy.port,
      username: bestProxy.username,
      password: bestProxy.password,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    debug(
      `Error getting working paid proxy for ${country}: ${errorMessage}`,
      'paid-proxy-services'
    );
    return null;
  }
}

// Main proxy testing function (now only for paid proxies)
export async function testProxy(
  proxy: PaidProxy,
  timeout: number = PROXY_CONFIG.FAST_FAIL_TIMEOUT
): Promise<boolean> {
  return testPaidProxy(proxy, timeout);
}

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
import { proxyCache } from '@/cache/cache';

// Helper function to validate proxy authentication
function hasValidAuthentication(proxy: PaidProxy): boolean {
  return !!(
    proxy.username &&
    proxy.password &&
    proxy.username.trim() !== '' &&
    proxy.password.trim() !== ''
  );
}

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
  // Use multiple test URLs for better reliability
  const testUrls = [
    'https://httpbin.org/ip',
    'https://api.ipify.org?format=json',
    'https://ipinfo.io/json',
  ];

  const maxRetries = PROXY_CONFIG.MAX_RETRIES;
  const retryDelay = PROXY_CONFIG.RETRY_DELAY;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    // Try different test URLs for each attempt
    const testUrl = testUrls[(attempt - 1) % testUrls.length];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Validate authentication credentials
      if (!hasValidAuthentication(proxy)) {
        debug(
          `❌ Proxy ${proxy.host}:${proxy.port} has invalid authentication credentials`,
          'paid-proxy-services'
        );
        return false;
      }

      // Use authentication if available
      const auth = {
        username: proxy.username!,
        password: proxy.password!,
      };

      // For Webshare proxies, we need to handle the authentication properly
      const proxyConfig = {
        host: proxy.host,
        port: proxy.port,
        protocol: 'http', // Explicitly set protocol to HTTP
        auth,
      };

      debug(
        `Testing proxy: ${proxy.host}:${proxy.port} with auth: ${auth.username}:*** (attempt ${attempt}/${maxRetries + 1}, URL: ${testUrl})`,
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
        // Verify we got a valid response (should contain IP information)
        const responseData = response.data;
        if (responseData && (responseData.origin || responseData.ip)) {
          info(
            `✅ Proxy ${proxy.host}:${proxy.port} passed test (attempt ${attempt}) - IP: ${responseData.origin || responseData.ip}`,
            'paid-proxy-services'
          );
          return true;
        } else {
          debug(
            `⚠️  Proxy ${proxy.host}:${proxy.port} returned 200 but invalid response data`,
            'paid-proxy-services'
          );
          if (attempt <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
          return false;
        }
      } else if (response.status === 429) {
        debug(
          `⚠️  Proxy ${proxy.host}:${proxy.port} rate limited (429) - attempt ${attempt}`,
          'paid-proxy-services'
        );
        // Add delay for rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (attempt <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        return false;
      } else if (response.status === 407) {
        debug(
          `❌ Proxy ${proxy.host}:${proxy.port} requires authentication (407) - attempt ${attempt}`,
          'paid-proxy-services'
        );
        // Don't retry authentication errors - they won't work
        return false;
      } else {
        debug(
          `⚠️  Proxy ${proxy.host}:${proxy.port} returned status ${response.status} - attempt ${attempt}`,
          'paid-proxy-services'
        );
        if (attempt <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      debug(
        `❌ Proxy ${proxy.host}:${proxy.port} failed test (attempt ${attempt}): ${errorMessage}`,
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

      // Retry logic for transient errors
      if (attempt <= maxRetries) {
        const isRetryableError =
          errorMessage.includes('ETIMEDOUT') ||
          errorMessage.includes('ECONNRESET') ||
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('ECONNREFUSED');

        if (isRetryableError) {
          debug(`   → Retrying in ${retryDelay}ms...`, 'paid-proxy-services');
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
    }
  }

  return false;
}

// Function to get working proxies for a specific country (paid proxies only)
export async function getWorkingProxiesForCountry(
  country: string,
  maxProxies: number = PROXY_CONFIG.MAX_PROXIES_PER_COUNTRY
): Promise<PaidProxy[]> {
  // Check cache first for tested working proxies
  const cacheKey = country;
  const cachedWorkingProxies = proxyCache.get(cacheKey);
  if (cachedWorkingProxies && cachedWorkingProxies.length > 0) {
    logProxyStatus(country, cachedWorkingProxies.length);
    return cachedWorkingProxies.slice(0, maxProxies);
  }

  // Get paid proxies for this country from API
  const paidProxies = await getPaidProxies([country]);

  logProxyStatus(country, paidProxies.length);

  // Filter and sort by uptime/reliability
  const countryProxies = paidProxies
    .filter(proxy => proxy.country === country)
    .sort((a, b) => b.uptime - a.uptime)
    .slice(0, Math.min(maxProxies, 3));

  if (countryProxies.length === 0) {
    return [];
  }

  info(
    `Testing ${countryProxies.length} paid proxies for ${country}:`,
    'paid-proxy-services'
  );
  countryProxies.forEach((proxy, index) => {
    info(
      `  ${index + 1}. ${proxy.host}:${proxy.port} (uptime: ${proxy.uptime}%)`,
      'paid-proxy-services'
    );
  });

  // Test proxies in parallel batches for better performance
  const concurrencyLimit = PROXY_CONFIG.MAX_CONCURRENT_PROXY_TESTS;
  const workingProxies: PaidProxy[] = [];

  for (let i = 0; i < countryProxies.length; i += concurrencyLimit) {
    const batch = countryProxies.slice(i, i + concurrencyLimit);
    const batchIndex = Math.floor(i / concurrencyLimit) + 1;
    const totalBatches = Math.ceil(countryProxies.length / concurrencyLimit);
    logBatchProcessing(batchIndex, totalBatches, batch);

    const testPromises = batch.map(async (proxy, batchIndex) => {
      const globalIndex = i + batchIndex + 1;

      // Skip proxies without authentication
      if (!hasValidAuthentication(proxy)) {
        debug(
          `⚠️ Skipping proxy ${proxy.host}:${proxy.port} - missing authentication`,
          'paid-proxy-services'
        );
        logProxyTesting(proxy, globalIndex, countryProxies.length, 'failed');
        return { proxy, isWorking: false };
      }

      logProxyTesting(proxy, globalIndex, countryProxies.length, 'testing');
      const isWorking = await testPaidProxy(
        proxy,
        PROXY_CONFIG.FAST_FAIL_TIMEOUT
      );
      logProxyTesting(
        proxy,
        globalIndex,
        countryProxies.length,
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
        if (workingProxies.length >= maxProxies) {
          break;
        }
      }
    }

    // Stop if we found enough working proxies
    if (workingProxies.length >= maxProxies) {
      break;
    }
  }

  // Cache the working proxies (not the raw API results)
  if (workingProxies.length > 0) {
    // Validate that all working proxies have proper authentication and were successfully tested
    const validWorkingProxies = workingProxies.filter(proxy => {
      const hasAuth = hasValidAuthentication(proxy);

      if (!hasAuth) {
        debug(
          `⚠️ Skipping proxy ${proxy.host}:${proxy.port} - missing authentication credentials`,
          'paid-proxy-services'
        );
        return false;
      }

      // Additional validation: ensure proxy has been successfully tested
      if (!proxy.lastChecked) {
        debug(
          `⚠️ Skipping proxy ${proxy.host}:${proxy.port} - not properly tested`,
          'paid-proxy-services'
        );
        return false;
      }

      return true;
    });

    if (validWorkingProxies.length > 0) {
      // Update the lastChecked timestamp for cached proxies
      const updatedProxies = validWorkingProxies.map(proxy => ({
        ...proxy,
        lastChecked: new Date().toISOString(),
      }));

      proxyCache.set(cacheKey, updatedProxies);
      info(
        `Found ${validWorkingProxies.length} working authenticated proxies for ${country}`,
        'paid-proxy-services'
      );
    } else {
      debug(
        `⚠️ No working authenticated proxies found for ${country}`,
        'paid-proxy-services'
      );
    }
  }

  return workingProxies;
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
    // Get working proxies (already tested and cached)
    const workingProxies = await getWorkingProxiesForCountry(
      country,
      PROXY_CONFIG.MAX_PROXIES_PER_COUNTRY
    );

    if (workingProxies.length === 0) {
      logProxyStatus(country, 0);
      return null;
    }

    // Return the best proxy with authentication details (already sorted by uptime)
    const bestProxy = workingProxies[0];
    return JSON.stringify({
      host: bestProxy.host,
      port: bestProxy.port,
      username: bestProxy.username,
      password: bestProxy.password,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    debug(
      `Failed to get working proxy for ${country}: ${errorMessage}`,
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

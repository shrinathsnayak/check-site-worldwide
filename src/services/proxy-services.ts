import https from 'https';
import axios from 'axios';
import { PROXY_CONFIG } from '@/constants/constants';
import { PaidProxy } from '@/types/types';
import { ALL_COUNTRIES } from '@/utils/countries';
import { fetchWebshareProxies } from './webshare-api';
import { logProxyStatus } from '@/utils/utils';
import { info, debug } from '@/utils/logger';
import { getWorkingProxiesForCountriesFromRedis } from '@/cache/proxy-redis';

// Helper function to validate proxy authentication
function hasValidAuthentication(proxy: PaidProxy): boolean {
  return !!(
    proxy.username &&
    proxy.password &&
    proxy.username.trim() !== '' &&
    proxy.password.trim() !== ''
  );
}

// Fetch proxies once for multiple countries and seed Redis with working ones
export async function seedWorkingProxiesForCountries(
  countries: string[],
  maxPerCountry: number = PROXY_CONFIG.MAX_PROXIES_PER_COUNTRY
): Promise<PaidProxy[]> {
  let existing: PaidProxy[] = [];
  try {
    const normalized = (
      countries.length > 0 ? countries : ALL_COUNTRIES.map(c => c.code)
    ).map(c => c.toUpperCase());

    // Determine which countries are missing in Redis (single read)
    existing = await getWorkingProxiesForCountriesFromRedis(normalized);
    const have = new Set(existing.map(p => (p.country || '').toUpperCase()));
    const missing = normalized.filter(c => !have.has(c));

    if (missing.length === 0) {
      return existing;
    }

    info(
      `Seed: fetching proxies for ${missing.length} countries (one API call w/ filter)`,
      'paid-proxy-services'
    );

    // Single Webshare API pull for all missing countries
    const rawProxies = await fetchWebshareProxies(missing);

    // Group by country and test a limited number per country
    const byCountry = new Map<string, PaidProxy[]>();
    for (const p of rawProxies) {
      const c = (p.country || '').toUpperCase();
      const arr = byCountry.get(c) || [];
      arr.push(p);
      byCountry.set(c, arr);
    }

    const allUpdated: PaidProxy[] = existing.slice();
    for (const country of missing) {
      const list = (byCountry.get(country) || [])
        .sort((a, b) => b.uptime - a.uptime)
        .slice(0, Math.min(maxPerCountry, 3));

      if (list.length === 0) continue;

      info(
        `Seed: testing ${list.length} proxies for ${country}`,
        'paid-proxy-services'
      );

      // Queue-based validation: quickly enqueue slow tests and continue with others
      const pendingQueue: PaidProxy[] = [];
      const quickTimeout = PROXY_CONFIG.SOFT_TEST_TIMEOUT || 4000;

      const results: Array<{ proxy: PaidProxy; ok: boolean }> =
        await Promise.all(
          list.map(async proxy => {
            // First, attempt a quick validation; if it times out, move to queue
            const quickPass = await Promise.race([
              testPaidProxy(proxy, quickTimeout),
              new Promise<boolean>(resolve =>
                setTimeout(() => resolve(false), quickTimeout + 50)
              ),
            ]);
            if (quickPass) return { proxy, ok: true } as const;
            pendingQueue.push(proxy);
            return { proxy, ok: false } as const;
          })
        );

      // Process queued (slow) proxies with increased timeout, stop early when target reached
      const targetCount = Math.min(maxPerCountry, list.length);
      let workingCount = results.filter(r => r.ok).length;
      for (const queued of pendingQueue) {
        if (workingCount >= targetCount) break;
        const ok = await testPaidProxy(
          queued,
          PROXY_CONFIG.FULL_TEST_TIMEOUT || PROXY_CONFIG.FAST_FAIL_TIMEOUT
        );
        const idx = results.findIndex(r => r.proxy === queued);
        if (idx >= 0) {
          (results as Array<{ proxy: PaidProxy; ok: boolean }>)[idx].ok = ok;
          if (ok) workingCount += 1;
        }
      }

      const working = results.filter(r => r.ok).map(r => r.proxy);
      if (working.length > 0) {
        const updated = working.map(p => ({
          ...p,
          lastChecked: new Date().toISOString(),
        }));
        // Replace country slice inside accumulated list
        const filtered = allUpdated.filter(
          p => (p.country || '').toUpperCase() !== country.toUpperCase()
        );
        allUpdated.splice(0, allUpdated.length, ...filtered, ...updated);
      }
    }

    // Write once to Redis (single command)
    const { setAllWorkingProxies } = await import('@/cache/proxy-redis');
    await setAllWorkingProxies(allUpdated);
    return allUpdated;
  } catch (err) {
    debug(
      `Seed error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      'paid-proxy-services'
    );
    return existing;
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
  maxProxies: number = PROXY_CONFIG.MAX_PROXIES_PER_COUNTRY,
  preloadedAll?: PaidProxy[]
): Promise<PaidProxy[]> {
  // If we have a preloaded list, use it directly without any Redis reads
  if (preloadedAll && preloadedAll.length > 0) {
    const filtered = preloadedAll.filter(
      p => (p.country || '').toUpperCase() === country.toUpperCase()
    );
    if (filtered.length > 0) {
      logProxyStatus(country, filtered.length);
      return filtered.slice(0, maxProxies);
    }
    return [];
  }

  // Fallback: single read for all, then filter by country
  const cachedWorkingProxies = (
    await getWorkingProxiesForCountriesFromRedis([country])
  ).filter(p => (p.country || '').toUpperCase() === country.toUpperCase());
  if (cachedWorkingProxies && cachedWorkingProxies.length > 0) {
    logProxyStatus(country, cachedWorkingProxies.length);
    return cachedWorkingProxies.slice(0, maxProxies);
  }

  // If cache miss, expect caller to seed beforehand
  return [];
}

// Function to get all available proxies for a country (paid proxies only)
export async function getAllProxiesForCountry(
  country: string
): Promise<PaidProxy[]> {
  const paidProxies: PaidProxy[] = await fetchWebshareProxies([country]);

  // Remove duplicates and sort by reliability
  const uniqueProxies = paidProxies.filter(
    (proxy: PaidProxy, index: number, self: PaidProxy[]) =>
      index ===
      self.findIndex(
        (p: PaidProxy) => p.host === proxy.host && p.port === proxy.port
      )
  );

  return uniqueProxies.sort(
    (a: PaidProxy, b: PaidProxy) => b.uptime - a.uptime
  );
}

// Function to get a working proxy for a specific country (paid proxies only)
export async function getWorkingProxyForCountry(
  country: string,
  preloadedAll?: PaidProxy[]
): Promise<string | null> {
  try {
    // Get working proxies (already tested and cached)
    const workingProxies = await getWorkingProxiesForCountry(
      country,
      PROXY_CONFIG.MAX_PROXIES_PER_COUNTRY,
      preloadedAll
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

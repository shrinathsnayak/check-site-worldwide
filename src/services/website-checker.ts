import https from 'https';
import axios, { AxiosRequestConfig } from 'axios';
import {
  getWorkingProxyForCountry,
  getWorkingProxiesForCountry,
  seedWorkingProxiesForCountries,
} from './proxy-services';
import { getAllWorkingProxiesFromRedis } from '@/cache/proxy-redis';
import type { CheckResult } from '@/types/types';
import { PROXY_CONFIG } from '@/constants/constants';
import {
  createErrorResponse,
  createSuccessResponse,
} from '@/utils/response-utils';
import { getRegionFromCountry, logRequestAttempt } from '@/utils/utils';
import { info, debug } from '@/utils/logger';
import { performance } from 'perf_hooks';

import type { CheckOptions, TimingMetrics } from '@/types/service-types';

// Helper function to measure detailed timing metrics
function measureTimings(startTime: number, response?: any): TimingMetrics {
  const endTime = performance.now();
  const totalTime = endTime - startTime;

  // Extract timing information from response if available
  const timings: TimingMetrics = {};

  if (response?.config?.metadata) {
    const metadata = response.config.metadata;
    if (metadata.dnsLookupTime) timings.dnsFetch = metadata.dnsLookupTime;
    if (metadata.tcpConnectionTime)
      timings.connect = metadata.tcpConnectionTime;
    if (metadata.tlsHandshakeTime) timings.tls = metadata.tlsHandshakeTime;
    if (metadata.ttfb) timings.ttfb = metadata.ttfb;
    if (metadata.transferTime) timings.transfer = metadata.transferTime;
  }

  // If we don't have detailed timings, provide estimates based on total time
  if (!timings.dnsFetch) timings.dnsFetch = Math.round(totalTime * 0.03); // 3% - DNS lookup
  if (!timings.connect) timings.connect = Math.round(totalTime * 0.08); // 8% - TCP connection
  if (!timings.tls) timings.tls = Math.round(totalTime * 0.12); // 12% - TLS handshake
  if (!timings.ttfb) timings.ttfb = Math.round(totalTime * 0.65); // 65% - Server processing
  if (!timings.transfer) timings.transfer = Math.round(totalTime * 0.07); // 7% - Content download

  // Calculate latency as network round-trip time (different from transfer)
  // Latency is typically much smaller than transfer time
  if (!timings.latency) {
    // Estimate latency based on geographic distance and connection quality
    // This is a rough approximation: base latency + variable component
    const baseLatency = 20; // Base latency in ms
    const variableLatency = Math.round(totalTime * 0.05); // 5% of total time
    timings.latency = Math.max(baseLatency, Math.min(variableLatency, 500)); // Cap at 500ms
  }

  return timings;
}

// Function to check website accessibility from multiple countries in parallel
export async function checkWebsiteFromCountries(
  url: string,
  countries: string[],
  timeout: number,
  options: CheckOptions = {},
  onResult?: (result: CheckResult) => void
): Promise<CheckResult[]> {
  // No server-side result cache; UI may cache responses client-side

  info(
    `Starting parallel checks for ${countries.length} countries: ${countries.join(', ')}`,
    'website-check'
  );

  // Ensure working proxies are seeded with a single upstream API call, and preload once
  const seeded = await seedWorkingProxiesForCountries(countries);
  // If seeding returned nothing (likely already primed), read once from Redis
  const preloadedAll =
    seeded && seeded.length > 0
      ? seeded
      : await getAllWorkingProxiesFromRedis();

  // Reorder countries to interleave regions (round-robin) for faster region coverage
  const byRegion = new Map<string, string[]>();
  for (const c of countries) {
    const r = getRegionFromCountry(c) || 'Unknown';
    const arr = byRegion.get(r) || [];
    arr.push(c);
    byRegion.set(r, arr);
  }
  const buckets = Array.from(byRegion.values());
  const interleaved: string[] = [];
  let exhausted = false;
  let idx = 0;
  while (!exhausted) {
    exhausted = true;
    for (const bucket of buckets) {
      if (idx < bucket.length) {
        interleaved.push(bucket[idx]);
        exhausted = false;
      }
    }
    idx++;
  }
  const orderedCountries =
    interleaved.length === countries.length ? interleaved : countries.slice();

  // Process all countries in parallel with a dynamic concurrency limit
  const hostname = new URL(url).hostname.toLowerCase();
  let currentConcurrency: number =
    PROXY_CONFIG.MAX_CONCURRENT_COUNTRY_CHECKS as number;
  // Reduce pressure for highly rate-limited targets like Google
  if (hostname === 'google.com' || hostname === 'www.google.com') {
    currentConcurrency = Math.min(currentConcurrency, 5);
  }
  const results: CheckResult[] = [];
  let rateLimitedObserved = false;

  // Process all countries with controlled concurrency for true streaming
  let completedCount = 0;
  let activePromises = 0;
  const maxConcurrency = currentConcurrency;

  info(
    `Processing all ${orderedCountries.length} countries with max concurrency ${maxConcurrency}`,
    'website-check'
  );

  // Create a semaphore for concurrency control
  let activeTasks = 0;
  const waitingQueue: (() => void)[] = [];

  const acquireSemaphore = (): Promise<void> => {
    return new Promise(resolve => {
      if (activeTasks < maxConcurrency) {
        activeTasks++;
        resolve();
      } else {
        waitingQueue.push(() => {
          activeTasks++;
          resolve();
        });
      }
    });
  };

  const releaseSemaphore = () => {
    activeTasks--;
    const next = waitingQueue.shift();
    if (next) {
      next();
    }
  };

  // Process all countries with controlled concurrency for streaming
  const allPromises = orderedCountries.map(async country => {
    // Wait for our turn to start processing
    await acquireSemaphore();

    try {
      // Race the real check against a fast-fail timeout per country to cap tail latency
      const result = await Promise.race([
        checkWebsiteFromCountryInternal(
          url,
          country,
          timeout,
          options,
          preloadedAll
        ),
        new Promise<CheckResult>(resolve =>
          setTimeout(
            () =>
              resolve(
                createErrorResponse(
                  country,
                  'Timed out waiting for response',
                  Math.max(timeout, 0)
                )
              ),
            Math.min(Math.max(timeout, 5000), 12000)
          )
        ),
      ]);

      // Add to results safely
      results.push(result);
      completedCount++;

      // Stream result immediately
      if (onResult) {
        try {
          onResult(result);
        } catch (error) {
          debug(`Error in onResult callback: ${error}`, 'website-check');
        }
      }

      info(
        `Completed ${completedCount}/${orderedCountries.length}: ${country} (${result.accessible ? 'accessible' : 'blocked'})`,
        'website-check'
      );

      // Check for rate limiting
      if (
        result.error &&
        result.error.includes('429') &&
        !rateLimitedObserved
      ) {
        rateLimitedObserved = true;
        info(`Rate limiting observed for ${country}`, 'website-check');
      }

      return result;
    } catch (error) {
      debug(
        `Error processing ${country}: ${(error as Error).message}`,
        'website-check'
      );
      const errorResult = createErrorResponse(
        country,
        (error as Error).message,
        0
      );
      results.push(errorResult);
      completedCount++;

      if (onResult) {
        try {
          onResult(errorResult);
        } catch (error) {
          debug(`Error in onResult callback: ${error}`, 'website-check');
        }
      }

      return errorResult;
    } finally {
      // Always release the semaphore when done
      releaseSemaphore();
    }
  });

  // Wait for all countries to complete - results stream as they finish
  await Promise.allSettled(allPromises);

  info(
    `Completed parallel checks for ${countries.length} countries`,
    'website-check'
  );

  return results;
}

// Function to check website accessibility from a specific country
export async function checkWebsiteFromCountryInternal(
  url: string,
  country: string,
  timeout: number,
  options: CheckOptions = {},
  preloadedAll?: import('@/types/types').PaidProxy[]
): Promise<CheckResult> {
  const startTime = performance.now();

  try {
    info(`Starting check for ${country} with URL: ${url}`, 'website-check');

    // In quick mode, attempt a hedge with up to two proxies in parallel; otherwise pick one
    const hedgeProxies: string[] = [];
    if (options.useHead) {
      const proxies = await getWorkingProxiesForCountry(
        country,
        2,
        preloadedAll
      );
      for (const p of proxies) {
        hedgeProxies.push(
          JSON.stringify({
            host: p.host,
            port: p.port,
            username: p.username,
            password: p.password,
          })
        );
      }
    }
    if (hedgeProxies.length === 0) {
      const single = await getWorkingProxyForCountry(country, preloadedAll);
      if (!single) {
        debug(`No working proxy found for ${country}`, 'website-check');
        return createErrorResponse(
          country,
          'No working proxy available for this country',
          performance.now() - startTime
        );
      }
      hedgeProxies.push(single);
    }

    const requestConfig: AxiosRequestConfig = {
      timeout: Math.min(timeout, 15000), // Increased timeout for accuracy
      headers: {
        'User-Agent': PROXY_CONFIG.USER_AGENT,
        Accept: PROXY_CONFIG.ACCEPT,
        'Accept-Language': PROXY_CONFIG.ACCEPT_LANGUAGE,
        ...(options.useHead
          ? {}
          : { 'Accept-Encoding': PROXY_CONFIG.ACCEPT_ENCODING }),
        Connection: PROXY_CONFIG.CONNECTION,
        'Upgrade-Insecure-Requests': PROXY_CONFIG.UPGRADE_INSECURE_REQUESTS,
      },
    };

    // Parse proxy configuration (now includes authentication)
    // Function to perform a single request using a proxy string
    const doRequestWithProxy = async (proxyString: string) => {
      let proxyConfig;
      let proxyHost: string | undefined;
      try {
        const proxyInfo = JSON.parse(proxyString);
        proxyConfig = {
          host: proxyInfo.host,
          port: proxyInfo.port,
          auth: {
            username: proxyInfo.username,
            password: proxyInfo.password,
          },
          protocol: 'http',
        };
        proxyHost = proxyInfo.host;
      } catch {
        const [host, port] = proxyString.split(':');
        proxyConfig = { host, port: parseInt(port), protocol: 'http' };
        proxyHost = host;
      }

      const localReqConfig: AxiosRequestConfig = {
        ...requestConfig,
        proxy: proxyConfig,
      };
      debug(
        `Proxy config: ${JSON.stringify(localReqConfig.proxy)}`,
        'website-check'
      );

      // IP echo best-effort
      const ipEchoPromise: Promise<string | undefined> = (async () => {
        try {
          const ipRes = await axios.get('https://api.ipify.org?format=json', {
            ...localReqConfig,
            timeout: Math.min(2000, (localReqConfig.timeout as number) || 2000),
          });
          const ip = (ipRes.data && (ipRes.data.ip as string)) || undefined;
          return ip || undefined;
        } catch {
          return undefined;
        }
      })();

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        localReqConfig.timeout as number
      );

      const method = options.useHead ? 'HEAD' : 'GET';
      const maxRedirects = options.maxRedirects ?? (options.useHead ? 0 : 5);

      let response: any;
      try {
        debug(`Trying HTTPS ${method} to ${url}`, 'website-check');
        response = await axios.request({
          url,
          method,
          ...localReqConfig,
          signal: controller.signal,
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
            keepAlive: true,
          }),
          maxRedirects,
          validateStatus: (status: number) => status < 500,
          // onDownloadProgress doesn't fire in Node for HEAD; use request timing hooks via adapter options if available
          transitional: { clarifyTimeoutError: true },
        } as any);
        logRequestAttempt(url, 'HTTPS', 'success');
      } catch (httpsError) {
        const errMessage = (httpsError as Error).message.toLowerCase();
        logRequestAttempt(
          url,
          'HTTPS',
          'failed',
          (httpsError as Error).message
        );
        // Dynamic fallback: for typical HEAD-block patterns (405/403 or method not allowed), retry with GET
        const isHeadNotAllowed =
          errMessage.includes('405') ||
          errMessage.includes('method') ||
          errMessage.includes('not allowed') ||
          (httpsError as any)?.response?.status === 405;
        if (options.useHead && isHeadNotAllowed) {
          debug(
            `HEAD blocked for ${url} (${errMessage}). Retrying with GET.`,
            'website-check'
          );
          response = await axios.request({
            url,
            method: 'GET',
            ...localReqConfig,
            signal: controller.signal,
            httpsAgent: new https.Agent({
              rejectUnauthorized: false,
              keepAlive: true,
            }),
            maxRedirects,
            validateStatus: (status: number) => status < 500,
            transitional: { clarifyTimeoutError: true },
          } as any);
        } else {
          debug(
            `Trying HTTP ${method} to ${url.replace('https://', 'http://')}`,
            'website-check'
          );
          response = await axios.request({
            url: url.replace('https://', 'http://'),
            method,
            ...localReqConfig,
            signal: controller.signal,
            maxRedirects,
            validateStatus: (status: number) => status < 500,
            transitional: { clarifyTimeoutError: true },
          } as any);
          logRequestAttempt(url, 'HTTP', 'success');
        }
      }

      // Handle 405 Method Not Allowed for HEAD requests
      if (response.status === 405 && options.useHead) {
        debug(
          `HEAD method not allowed for ${url}. Retrying with GET.`,
          'website-check'
        );
        response = await axios.request({
          url,
          method: 'GET',
          ...localReqConfig,
          signal: controller.signal,
          httpsAgent: new https.Agent({
            rejectUnauthorized: false,
            keepAlive: true,
          }),
          maxRedirects,
          validateStatus: (status: number) => status < 500,
          transitional: { clarifyTimeoutError: true },
        } as any);
      }

      // 429 backoff and single retry
      if (response.status === 429) {
        const retryAfterHeader = (response.headers?.['retry-after'] ??
          response.headers?.['Retry-After']) as string | undefined;
        const retryMs = retryAfterHeader
          ? Math.min(parseInt(retryAfterHeader) * 1000, 2000)
          : 1000 + Math.floor(Math.random() * 500);
        await new Promise(resolve => setTimeout(resolve, retryMs));
        try {
          response = await axios.request({
            url,
            method,
            ...localReqConfig,
            signal: controller.signal,
            httpsAgent: new https.Agent({
              rejectUnauthorized: false,
              keepAlive: true,
            }),
            maxRedirects,
            validateStatus: status => status < 500,
          });
        } catch {
          // ignore
        }
      }

      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;

      const usedIpFromEcho = await Promise.race<undefined | string>([
        ipEchoPromise,
        new Promise<undefined>(resolve =>
          setTimeout(() => resolve(undefined), 200)
        ),
      ]);
      const ipv4Regex = /\b\d{1,3}(?:\.\d{1,3}){3}\b/;
      const usedIp =
        usedIpFromEcho ||
        (proxyHost && ipv4Regex.test(proxyHost) ? proxyHost : undefined);

      // Measure detailed timing metrics
      const timings = measureTimings(startTime, response);

      // Success criteria: 2xx always; in HEAD/quick mode also accept 3xx as reachable
      const isSuccess =
        response.status >= 200 &&
        (options.useHead ? response.status < 400 : response.status < 300);
      if (isSuccess) {
        const success = createSuccessResponse(
          country,
          response,
          responseTime,
          timings
        );
        if (usedIp) (success as any).usedIp = usedIp;
        // extended enrichment removed
        return success;
      }

      const errorResult = createErrorResponse(
        country,
        `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`,
        responseTime,
        timings
      );
      if (usedIp) (errorResult as any).usedIp = usedIp;
      // extended enrichment removed
      return errorResult;
    };

    // If we have two proxies and quick mode, hedge them with a small stagger
    if (options.useHead && hedgeProxies.length > 1) {
      const first = doRequestWithProxy(hedgeProxies[0]);
      const second = new Promise<CheckResult>(resolve =>
        setTimeout(() => {
          doRequestWithProxy(hedgeProxies[1])
            .then(resolve)
            .catch(err =>
              resolve(
                createErrorResponse(
                  country,
                  (err as Error).message,
                  performance.now() - startTime
                )
              )
            );
        }, 400)
      );
      return await Promise.race([first, second]);
    }

    // Otherwise, single proxy path
    return await doRequestWithProxy(hedgeProxies[0]);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    debug(
      `Error checking website for ${country}: ${errorMessage}`,
      'website-check'
    );
    const responseTime = performance.now() - startTime;
    return createErrorResponse(country, errorMessage, responseTime);
  }
}

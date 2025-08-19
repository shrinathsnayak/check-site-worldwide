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
import { getRegionFromCountry, getCountryName } from '@/utils/utils';
import { logRequestAttempt } from '@/utils/utils';
import { info, debug } from '@/utils/logger';
import { performance } from 'perf_hooks';

// Inline response creation functions
function createErrorResponse(
  country: string,
  error: string,
  responseTime: number = 0,
  timings?: CheckResult['timings']
): CheckResult {
  return {
    country,
    countryName: getCountryName(country),
    region: getRegionFromCountry(country),
    accessible: false,
    responseTime,
    statusCode: 0,
    error,
    timestamp: new Date().toISOString(),
    timings,
  };
}

function createSuccessResponse(
  country: string,
  response: { status: number },
  responseTime: number,
  timings?: CheckResult['timings']
): CheckResult {
  return {
    country,
    countryName: getCountryName(country),
    region: getRegionFromCountry(country),
    accessible: true,
    responseTime,
    statusCode: response.status,
    timestamp: new Date().toISOString(),
    timings,
  };
}

interface CheckOptions {
  useHead?: boolean;
  maxRedirects?: number;
}

interface TimingMetrics {
  dnsFetch?: number;
  connect?: number;
  tls?: number;
  ttfb?: number;
  transfer?: number;
  latency?: number;
}

// Helper function to measure detailed timing metrics
function measureTimings(startTime: number, response?: any): TimingMetrics {
  const endTime = performance.now();
  const totalTime = endTime - startTime;

  // Extract timing information from response if available
  const timings: TimingMetrics = {};

  if (response?.config?.metadata) {
    const metadata = response.config.metadata;
    if (metadata.dnsLookupTime) timings.dnsFetch = metadata.dnsLookupTime;
    if (metadata.tcpConnectionTime) timings.connect = metadata.tcpConnectionTime;
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

  // Process countries in batches to control concurrency (dynamic)
  for (let i = 0; i < orderedCountries.length;) {
    const batch = orderedCountries.slice(i, i + currentConcurrency);
    info(
      `Processing batch ${Math.floor(i / currentConcurrency) + 1}: ${batch.join(', ')}`,
      'website-check'
    );

    const batchPromises = batch.map(async country => {
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
        return result;
      } catch (error) {
        debug(
          `Error processing ${country}: ${(error as Error).message}`,
          'website-check'
        );
        return createErrorResponse(country, (error as Error).message, 0);
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);

    // Process batch results and wait for all onResult callbacks
    const onResultPromises: Promise<void>[] = [];

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        if (onResult) {
          try {
            const onResultPromise = Promise.resolve(onResult(result.value));
            onResultPromises.push(onResultPromise);
          } catch (error) {
            debug(`Error in onResult callback: ${error}`, 'website-check');
          }
        }
      } else {
        debug(`Batch promise rejected: ${result.reason}`, 'website-check');
      }
    }

    // Wait for all onResult callbacks to complete before continuing
    if (onResultPromises.length > 0) {
      await Promise.allSettled(onResultPromises);
    }

    // Adjust concurrency if we see signs of rate limiting
    const saw429 = results
      .slice(-batch.length)
      .some(r => (r.error || '').includes('429'));
    if (saw429 && !rateLimitedObserved) {
      rateLimitedObserved = true;
      currentConcurrency = Math.max(3, Math.floor(currentConcurrency / 2));
      info(
        `Rate limiting observed. Reducing concurrency to ${currentConcurrency}`,
        'website-check'
      );
    }

    // Reduce or remove inter-batch delay to accelerate checks
    // If you observe upstream rate-limiting, consider reintroducing a small delay (e.g., 500ms)
    i += batch.length;
  }

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
          errMessage.includes('not allowed');
        if (options.useHead && isHeadNotAllowed) {
          debug(`HEAD blocked for ${url}. Retrying with GET.`, 'website-check');
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
        const success = createSuccessResponse(country, response, responseTime, timings);
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

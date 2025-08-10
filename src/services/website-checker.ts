import https from 'https';
import axios, { AxiosRequestConfig } from 'axios';
import {
  getWorkingProxyForCountry,
  getWorkingProxiesForCountry,
} from './proxy-services';
import type { CheckResult } from '@/types/types';
import { PROXY_CONFIG } from '@/constants/constants';
import { logRequestAttempt } from '@/utils/utils';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';
import { websiteCheckCache } from '@/cache/cache';
import { info, debug } from '@/utils/logger';

interface CheckOptions {
  useHead?: boolean;
  maxRedirects?: number;
}

// Function to check website accessibility from multiple countries in parallel
export async function checkWebsiteFromCountries(
  url: string,
  countries: string[],
  timeout: number,
  options: CheckOptions = {}
): Promise<CheckResult[]> {
  // Check cache first
  const cacheKey = `${url}:${countries.sort().join(',')}`;
  const cachedResults = websiteCheckCache.get(cacheKey);
  if (cachedResults) {
    info(`📦 Using cached website check results for ${url}`, 'website-check');
    return cachedResults;
  }

  info(
    `Starting parallel checks for ${countries.length} countries: ${countries.join(', ')}`,
    'website-check'
  );

  // Process all countries in parallel with a dynamic concurrency limit
  const hostname = new URL(url).hostname.toLowerCase();
  let concurrencyLimit: number = PROXY_CONFIG.MAX_CONCURRENT_COUNTRY_CHECKS as number;
  // Reduce pressure for highly rate-limited targets like Google
  if (hostname === 'google.com' || hostname === 'www.google.com') {
    concurrencyLimit = Math.min(concurrencyLimit, 5);
  }
  const results: CheckResult[] = [];

  // Process countries in batches to control concurrency
  for (let i = 0; i < countries.length; i += concurrencyLimit) {
    const batch = countries.slice(i, i + concurrencyLimit);
    info(
      `Processing batch ${Math.floor(i / concurrencyLimit) + 1}: ${batch.join(', ')}`,
      'website-check'
    );

    const batchPromises = batch.map(async country => {
      try {
        // Race the real check against a fast-fail timeout per country to cap tail latency
        const result = await Promise.race([
          checkWebsiteFromCountryInternal(url, country, timeout, options),
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

    // Process batch results
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        debug(`Batch promise rejected: ${result.reason}`, 'website-check');
      }
    }

    // Reduce or remove inter-batch delay to accelerate checks
    // If you observe upstream rate-limiting, consider reintroducing a small delay (e.g., 500ms)
  }

  info(
    `Completed parallel checks for ${countries.length} countries`,
    'website-check'
  );

  // Cache the results
  websiteCheckCache.set(cacheKey, results);

  return results;
}

// Function to check website accessibility from a specific country
export async function checkWebsiteFromCountryInternal(
  url: string,
  country: string,
  timeout: number,
  options: CheckOptions = {}
): Promise<CheckResult> {
  const startTime = Date.now();

  try {
    info(`Starting check for ${country} with URL: ${url}`, 'website-check');

    // In quick mode, attempt a hedge with up to two proxies in parallel; otherwise pick one
    const hedgeProxies: string[] = [];
    if (options.useHead) {
      const proxies = await getWorkingProxiesForCountry(country, 2);
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
      const single = await getWorkingProxyForCountry(country);
      if (!single) {
        debug(`No working proxy found for ${country}`, 'website-check');
        return createErrorResponse(
          country,
          'No working proxy available for this country',
          Date.now() - startTime
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

      let response;
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
          validateStatus: status => status < 500,
        });
        logRequestAttempt(url, 'HTTPS', 'success');
      } catch (httpsError) {
        logRequestAttempt(
          url,
          'HTTPS',
          'failed',
          (httpsError as Error).message
        );
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
          validateStatus: status => status < 500,
        });
        logRequestAttempt(url, 'HTTP', 'success');
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
      const responseTime = Date.now() - startTime;

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

      // Success criteria: 2xx always; in HEAD/quick mode also accept 3xx as reachable
      const isSuccess =
        response.status >= 200 &&
        (options.useHead ? response.status < 400 : response.status < 300);
      if (isSuccess) {
        const success = createSuccessResponse(country, response, responseTime);
        if (usedIp) (success as any).usedIp = usedIp;
        return success;
      }

      const errorResult = createErrorResponse(
        country,
        `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`,
        responseTime
      );
      if (usedIp) (errorResult as any).usedIp = usedIp;
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
                  Date.now() - startTime
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
    const responseTime = Date.now() - startTime;
    return createErrorResponse(country, errorMessage, responseTime);
  }
}

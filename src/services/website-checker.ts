import https from 'https';
import axios, { AxiosRequestConfig } from 'axios';
import { getWorkingProxyForCountry } from './proxy-services';
import type { CheckResult } from '@/types/types';
import { PROXY_CONFIG } from '@/constants/constants';
import { logRequestAttempt } from '@/utils/utils';
import { createErrorResponse, createSuccessResponse } from '@/utils/response';
import { websiteCheckCache } from '@/cache/cache';
import { info, debug } from '@/utils/logger';

// Function to check website accessibility from multiple countries in parallel
export async function checkWebsiteFromCountries(
  url: string,
  countries: string[],
  timeout: number
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

  // Process all countries in parallel with concurrency limit
  const concurrencyLimit = PROXY_CONFIG.MAX_CONCURRENT_COUNTRY_CHECKS;
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
        const result = await checkWebsiteFromCountryInternal(
          url,
          country,
          timeout
        );
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

    // Add delay between batches to avoid rate limiting
    if (i + concurrencyLimit < countries.length) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
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
  timeout: number
): Promise<CheckResult> {
  const startTime = Date.now();

  try {
    info(`Starting check for ${country} with URL: ${url}`, 'website-check');

    // Get a working paid proxy for this country
    const proxyString = await getWorkingProxyForCountry(country);

    // If no working proxy found, return not accessible
    if (!proxyString) {
      debug(`No working paid proxy found for ${country}`, 'website-check');
      return createErrorResponse(
        country,
        'No working paid proxy available for this country',
        Date.now() - startTime
      );
    }

    info(`Using paid proxy ${proxyString} for ${country}`, 'website-check');

    const requestConfig: AxiosRequestConfig = {
      timeout: Math.min(timeout, 15000), // Increased timeout for accuracy
      headers: {
        'User-Agent': PROXY_CONFIG.USER_AGENT,
        Accept: PROXY_CONFIG.ACCEPT,
        'Accept-Language': PROXY_CONFIG.ACCEPT_LANGUAGE,
        'Accept-Encoding': PROXY_CONFIG.ACCEPT_ENCODING,
        Connection: PROXY_CONFIG.CONNECTION,
        'Upgrade-Insecure-Requests': PROXY_CONFIG.UPGRADE_INSECURE_REQUESTS,
      },
    };

    // Parse proxy configuration (now includes authentication)
    let proxyConfig;
    try {
      const proxyInfo = JSON.parse(proxyString);
      proxyConfig = {
        host: proxyInfo.host,
        port: proxyInfo.port,
        auth: {
          username: proxyInfo.username,
          password: proxyInfo.password,
        },
        protocol: 'http', // Explicitly set protocol to HTTP
      };
    } catch {
      // Fallback for old format (host:port)
      const [host, port] = proxyString.split(':');
      proxyConfig = {
        host,
        port: parseInt(port),
        protocol: 'http', // Explicitly set protocol to HTTP
      };
    }

    requestConfig.proxy = proxyConfig;
    debug(
      `Proxy config: ${JSON.stringify(requestConfig.proxy)}`,
      'website-check'
    );

    // Make the actual HTTP request with timeout and lenient SSL
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      requestConfig.timeout
    );

    let response;
    try {
      debug(`Trying HTTPS request to ${url}`, 'website-check');
      response = await axios.get(url, {
        ...requestConfig,
        signal: controller.signal,
        // Use default SSL settings for better compatibility
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
        // Additional settings for proxy compatibility
        maxRedirects: 5,
        validateStatus: status => status < 500, // Accept any status < 500
      });
      logRequestAttempt(url, 'HTTPS', 'success');
    } catch (httpsError) {
      logRequestAttempt(url, 'HTTPS', 'failed', (httpsError as Error).message);
      // If HTTPS fails, try HTTP as fallback
      debug(
        `Trying HTTP request to ${url.replace('https://', 'http://')}`,
        'website-check'
      );
      response = await axios.get(url.replace('https://', 'http://'), {
        ...requestConfig,
        signal: controller.signal,
        // HTTP doesn't need SSL agent
        maxRedirects: 5,
        validateStatus: status => status < 500,
      });
      logRequestAttempt(url, 'HTTP', 'success');
    }

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // Check if response is successful (status 200-299)
    if (response.status >= 200 && response.status < 300) {
      return createSuccessResponse(country, response, responseTime);
    } else {
      return createErrorResponse(
        country,
        `HTTP ${response.status}: ${response.statusText || 'Unknown error'}`,
        responseTime
      );
    }
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

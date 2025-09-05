import axios from 'axios';
import { info, warn } from '@/utils/logger';

export interface URLReachabilityResult {
  isReachable: boolean;
  statusCode?: number;
  error?: string;
  responseTime: number;
}

/**
 * Quick reachability check for a URL before running expensive proxy tests
 * Uses direct connection without proxies for fast validation
 */
export async function checkURLReachability(
  url: string,
  timeout: number = 10000
): Promise<URLReachabilityResult> {
  const startTime = Date.now();

  try {
    info(`Checking URL reachability for: ${url}`, 'url-reachability');

    // Try a HEAD request first (faster)
    const response = await axios.head(url, {
      timeout,
      validateStatus: status => status < 500, // Accept 4xx but not 5xx
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Check-Site-Worldwide/1.0',
        Accept: '*/*',
      },
    });

    const responseTime = Date.now() - startTime;

    info(
      `URL reachability check passed: ${url} (${response.status}) in ${responseTime}ms`,
      'url-reachability'
    );

    return {
      isReachable: true,
      statusCode: response.status,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (axios.isAxiosError(error)) {
      // Check for specific error types
      if (error.code === 'ENOTFOUND' || error.code === 'EAI_NODATA') {
        warn(
          `DNS resolution failed for ${url}: ${error.message}`,
          'url-reachability'
        );
        return {
          isReachable: false,
          error: `Domain not found: ${error.message}`,
          responseTime,
        };
      }

      if (error.code === 'ECONNREFUSED') {
        warn(
          `Connection refused for ${url}: ${error.message}`,
          'url-reachability'
        );
        return {
          isReachable: false,
          error: `Connection refused: ${error.message}`,
          responseTime,
        };
      }

      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        warn(
          `Timeout reached for ${url}: ${error.message}`,
          'url-reachability'
        );
        return {
          isReachable: false,
          error: `Connection timeout: ${error.message}`,
          responseTime,
        };
      }

      // If we get a response but it's a server error (5xx)
      if (error.response && error.response.status >= 500) {
        warn(
          `Server error for ${url}: ${error.response.status}`,
          'url-reachability'
        );
        return {
          isReachable: false,
          statusCode: error.response.status,
          error: `Server error: ${error.response.status} ${error.response.statusText}`,
          responseTime,
        };
      }

      // If HEAD fails, try GET with a small range to be more compatible
      if (error.response && error.response.status === 405) {
        try {
          const getResponse = await axios.get(url, {
            timeout: Math.max(timeout - responseTime, 2000),
            validateStatus: status => status < 500,
            maxRedirects: 5,
            headers: {
              'User-Agent': 'Check-Site-Worldwide/1.0',
              Accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              Range: 'bytes=0-1023', // Only get first 1KB
            },
            responseType: 'stream',
          });

          // Close the stream immediately
          if (
            getResponse.data &&
            typeof getResponse.data.destroy === 'function'
          ) {
            getResponse.data.destroy();
          }

          const finalResponseTime = Date.now() - startTime;

          info(
            `URL reachability check passed (via GET): ${url} (${getResponse.status}) in ${finalResponseTime}ms`,
            'url-reachability'
          );

          return {
            isReachable: true,
            statusCode: getResponse.status,
            responseTime: finalResponseTime,
          };
        } catch (getError) {
          warn(
            `Both HEAD and GET failed for ${url}: ${getError}`,
            'url-reachability'
          );
          return {
            isReachable: false,
            error: `URL not accessible: ${error.message}`,
            responseTime: Date.now() - startTime,
          };
        }
      }
    }

    warn(
      `URL reachability check failed for ${url}: ${error}`,
      'url-reachability'
    );

    return {
      isReachable: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    };
  }
}

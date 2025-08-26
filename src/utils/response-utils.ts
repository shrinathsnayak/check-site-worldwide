import type { CheckResult } from '@/types/types';
import { getCountryName, getRegionFromCountry } from '@/utils/utils';

/**
 * Creates an error response for a failed website check
 */
export function createErrorResponse(
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

/**
 * Creates a success response for a successful website check
 */
export function createSuccessResponse(
  country: string,
  response: { status: number },
  responseTime: number,
  timings?: CheckResult['timings'],
  usedIp?: string
): CheckResult {
  return {
    country,
    countryName: getCountryName(country),
    region: getRegionFromCountry(country),
    accessible: response.status >= 200 && response.status < 400,
    responseTime,
    statusCode: response.status,
    timestamp: new Date().toISOString(),
    timings,
    usedIp,
  };
}

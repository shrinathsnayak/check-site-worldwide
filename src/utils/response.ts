// Centralized response handling functions
import type { CheckResult, CheckSummary } from '@/types/types';
import { getCountryName, getRegionFromCountry } from '@/utils/utils';

// Helper function to create standardized error responses
export function createErrorResponse(
  country: string,
  error: string,
  responseTime: number = 0
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
  };
}

// Helper function to create successful responses
export function createSuccessResponse(
  country: string,
  response: { status: number },
  responseTime: number
): CheckResult {
  return {
    country,
    countryName: getCountryName(country),
    region: getRegionFromCountry(country),
    accessible: true,
    responseTime,
    statusCode: response.status,
    timestamp: new Date().toISOString(),
  };
}

// Function to generate summary statistics from results
export function generateSummary(results: CheckResult[]): CheckSummary {
  const total = results.length;
  const accessible = results.filter(r => r.accessible).length;
  const inaccessible = total - accessible;
  const successRate = total > 0 ? (accessible / total) * 100 : 0;

  const responseTimes = results.map(r => r.responseTime).filter(t => t > 0);
  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) /
        responseTimes.length
      : 0;

  return {
    total,
    accessible,
    inaccessible,
    successRate,
    avgResponseTime,
  };
}

// Function to group results by region
export function groupResultsByRegion(
  results: CheckResult[]
): Record<string, CheckResult[]> {
  return results.reduce(
    (acc, result) => {
      if (!acc[result.region]) {
        acc[result.region] = [];
      }
      acc[result.region].push(result);
      return acc;
    },
    {} as Record<string, CheckResult[]>
  );
}

// Function to create API response object
export function createApiResponse(
  url: string,
  results: CheckResult[]
): {
  success: boolean;
  url: string;
  summary: CheckSummary;
  resultsByRegion: Record<string, CheckResult[]>;
} {
  const summary = generateSummary(results);
  const resultsByRegion = groupResultsByRegion(results);

  return {
    success: true,
    url,
    summary,
    resultsByRegion,
  };
}

import type { CheckResult } from '@/types/types';
import type { CountryStatus } from '@/types/component-types';

/**
 * Get the appropriate color for a country status badge
 */
export function getStatusColor(
  status: CountryStatus,
  result?: CheckResult
): string {
  switch (status) {
    case 'completed':
      return result?.accessible ? 'green' : 'red';
    case 'error':
      return 'red';
    case 'loading':
      return 'blue';
    default:
      return 'gray';
  }
}

/**
 * Get the appropriate text for a country status
 */
export function getStatusText(
  status: CountryStatus,
  result?: CheckResult
): string {
  switch (status) {
    case 'completed':
      return result?.statusCode?.toString() || 'Unknown';
    case 'error':
      return 'Error';
    case 'loading':
      return 'Checking...';
    default:
      return 'Pending';
  }
}

/**
 * Get the background color for a country card based on status
 */
export function getCardBackgroundColor(
  status: CountryStatus,
  result?: CheckResult
): string {
  if (status === 'completed' && result?.accessible)
    return 'rgba(34,197,94,0.12)';
  if (status === 'completed' && !result?.accessible)
    return 'rgba(239,68,68,0.12)';
  if (status === 'loading') return 'rgba(59,130,246,0.12)';
  return 'rgba(156,163,175,0.12)';
}

/**
 * Get the border color for a country card based on status
 */
export function getCardBorderColor(
  status: CountryStatus,
  result?: CheckResult
): string {
  if (status === 'completed' && result?.accessible)
    return '1px solid rgba(34,197,94,0.25)';
  if (status === 'completed' && !result?.accessible)
    return '1px solid rgba(239,68,68,0.25)';
  if (status === 'loading') return '1px solid rgba(59,130,246,0.25)';
  return '1px solid rgba(156,163,175,0.25)';
}

/**
 * Calculate statistics from country states
 */
export function calculateCountryStats(
  countryStates: Array<{
    status: CountryStatus;
    result?: CheckResult;
  }>
) {
  const successfulCount = countryStates.filter(
    c => c.status === 'completed' && c.result?.accessible
  ).length;

  const errorCount = countryStates.filter(
    c => c.status === 'completed' && c.result && !c.result.accessible
  ).length;

  const avgResponseTime =
    countryStates
      .filter(c => c.result?.accessible)
      .reduce((sum, c) => sum + (c.result?.responseTime || 0), 0) /
    Math.max(1, successfulCount);

  return {
    successfulCount,
    errorCount,
    avgResponseTime,
  };
}

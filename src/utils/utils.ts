// Utility functions for logging and formatting
import { getCountryByCode } from './countries';
import { info, warn, error as logError } from './logger';

// Helper function to log proxy processing status
export function logProxyProcessing(
  countries: string[],
  proxyCount: number,
  action: string
): void {
  const countryList = countries.length > 0 ? countries.join(', ') : 'all';
  info(
    `📡 ${action} for ${countryList}: ${proxyCount} proxies`,
    'proxy-processing'
  );
}

// Helper function to log cache operations
export function logCacheOperation(
  operation: string,
  countries: string[],
  data?: unknown
): void {
  const countryList = countries.length > 0 ? countries.join(', ') : 'all';
  if (data) {
    info(
      `💾 ${operation} for ${countryList}: ${(data as { length: number }).length} proxies`,
      'cache-operation'
    );
  } else {
    info(`💾 ${operation} for ${countryList}`, 'cache-operation');
  }
}

// Helper function to log proxy availability status
export function logProxyStatus(
  country: string,
  proxyCount: number,
  hasWorkingProxy: boolean = false
): void {
  if (proxyCount === 0) {
    warn(`❌ No Webshare proxies available for ${country}`, 'proxy-status');
  } else if (!hasWorkingProxy) {
    warn(`⚠️  No working proxy found for ${country}`, 'proxy-status');
  } else {
    info(`✅ Found working proxy for ${country}`, 'proxy-status');
  }
}

// Helper function to log proxy testing progress
export function logProxyTesting(
  proxy: { host: string; port: number },
  index: number,
  total: number,
  status: 'testing' | 'working' | 'failed'
): void {
  const statusEmoji =
    status === 'working' ? '✅' : status === 'failed' ? '❌' : '🔍';
  const statusText =
    status === 'working'
      ? 'WORKING'
      : status === 'failed'
        ? 'FAILED'
        : 'TESTING';
  info(
    `${statusEmoji} Proxy ${index}/${total}: ${proxy.host}:${proxy.port} - ${statusText}`,
    'proxy-testing'
  );
}

// Helper function to log batch processing
export function logBatchProcessing(
  batchIndex: number,
  totalBatches: number,
  proxies: { host: string; port: number }[]
): void {
  const proxyList = proxies.map(p => `${p.host}:${p.port}`).join(', ');
  info(
    `🔍 Testing proxy batch ${batchIndex}/${totalBatches}: ${proxyList}`,
    'batch-processing'
  );
}

// Helper function to log request attempts
export function logRequestAttempt(
  url: string,
  protocol: 'HTTPS' | 'HTTP',
  status: 'success' | 'failed',
  error?: string
): void {
  const statusEmoji = status === 'success' ? '✅' : '❌';
  const statusText = status === 'success' ? 'successful' : 'failed';
  if (error) {
    logError(
      `${statusEmoji} ${protocol} request ${statusText}: ${error}`,
      'request-attempt'
    );
  } else {
    info(`${statusEmoji} ${protocol} request ${statusText}`, 'request-attempt');
  }
}

// Helper function to get country name
export function getCountryName(country: string): string {
  const countryInfo = getCountryByCode(country);
  return countryInfo?.name || 'Unknown';
}

// Helper function to get region from country
export function getRegionFromCountry(country: string): string {
  const countryInfo = getCountryByCode(country);
  return countryInfo?.region || 'Unknown';
}

export function getCountryFlagFromISOCode(country: string): string {
  if (!country || country.length !== 2) {
    return '🏳️';
  }

  const codePoints = country
    .toUpperCase()
    .split('')
    .map(char => char.charCodeAt(0) - 65 + 0x1f1e6);

  return String.fromCodePoint(...codePoints);
}

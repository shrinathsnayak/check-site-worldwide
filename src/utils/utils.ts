// Utility functions for logging and formatting
import { ALL_COUNTRIES, getCountryByCode } from './countries';
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

export const getCountryAndContinentCounts = () => {
  const countryCount = ALL_COUNTRIES.length;
  const uniqueContinents = new Set(
    ALL_COUNTRIES.map(country => country.continent)
  );
  const continentCount = uniqueContinents.size;

  return { countryCount, continentCount };
};

// Converts milliseconds to seconds with configurable precision
export function millisecondsToSeconds(
  milliseconds: number,
  fractionDigits: number = 1
): number {
  if (!Number.isFinite(milliseconds)) return 0;
  const seconds = milliseconds / 1000;
  return Number(seconds.toFixed(fractionDigits));
}

// Detects common anti-bot / VPN-block pages and returns a reason string if detected
export function isLikelyBlockedResponse(
  _url: string,
  body: unknown
): string | null {
  try {
    let text = '';
    if (typeof body === 'string') {
      text = body;
    } else if (body && typeof body === 'object') {
      try {
        text = JSON.stringify(body).slice(0, 4000);
      } catch {
        text = '';
      }
    }

    const lower = text.toLowerCase();

    // Generic anti-bot / block indicators (site-agnostic)
    const indicators = [
      'access denied',
      'forbidden',
      'blocked',
      'not allowed',
      'unusual traffic',
      'request blocked',
      'verify you are human',
      'are you a robot',
      'complete the security check',
      'please enable javascript',
      'captcha',
      'attention required',
      'checking your browser',
      'temporary blocked',
      'suspicious activity',
      'vpn',
      'proxy',
      'unblocker',
    ];

    if (indicators.some(k => lower.includes(k))) {
      return 'Content indicates access is blocked or challenged';
    }

    return null;
  } catch {
    return null;
  }
}

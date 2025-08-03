import { WebshareProxy } from '@/types/types';

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function validateTimeout(timeoutParam: string | null): number {
  if (!timeoutParam) return 10000;

  const timeoutNum = parseInt(timeoutParam);
  if (isNaN(timeoutNum)) return 10000;

  return Math.min(Math.max(timeoutNum, 1000), 30000);
}

export function validateCountries(
  countriesParam: string | null,
  supportedCountries: string[]
): { isValid: boolean; countries: string[]; invalidCountries: string[] } {
  if (!countriesParam) {
    return {
      isValid: true,
      countries: supportedCountries,
      invalidCountries: [],
    };
  }

  const countries = countriesParam.split(',').map(c => c.trim().toUpperCase());
  const invalidCountries = countries.filter(
    country => !supportedCountries.includes(country)
  );

  return {
    isValid: invalidCountries.length === 0,
    countries: countries,
    invalidCountries,
  };
}

// Function to validate IP address format
export function isValidIP(ip: string): boolean {
  const ipRegex =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return Boolean(ipRegex.test(ip));
}

// Function to validate proxy data
export function isValidProxy(proxy: WebshareProxy): boolean {
  return (
    proxy.valid &&
    isValidIP(proxy.proxy_address) &&
    proxy.port > 0 &&
    proxy.port <= 65535 &&
    proxy.username.length > 0 &&
    proxy.password.length > 0 &&
    proxy.country_code.length > 0
  );
}

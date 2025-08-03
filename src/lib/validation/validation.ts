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

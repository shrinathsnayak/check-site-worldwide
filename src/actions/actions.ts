'use server';

import { checkWebsiteFromCountries } from '@/services/website-checker';
import {
  validateUrl,
  validateTimeout,
  validateCountries,
} from '@/validation/validation';
import { ALL_COUNTRIES } from '@/utils/countries';
import { createApiResponse } from '@/utils/response';
import type { CheckResponse } from '@/types/types';
import { MOCK_CHECK_RESPONSE } from '@/mocks/checkResponse';

export async function checkWebsiteAction(
  formData: FormData
): Promise<CheckResponse> {
  const url = formData.get('url') as string;

  if (!url) {
    throw new Error('URL is required');
  }

  if (!validateUrl(url)) {
    throw new Error('Invalid URL format');
  }

  // Check website from all countries
  const results = await checkWebsiteFromCountries(
    url,
    ALL_COUNTRIES.map(country => country.code),
    30000 // 30 second timeout
  );

  // Create API response
  return createApiResponse(url, results);
}

export async function getCheckResults(params: {
  url: string;
  countries?: string; // comma separated
  timeout?: string; // ms
  mock?: string; // '1' to enable mock
  mode?: 'quick' | 'full';
}): Promise<CheckResponse> {
  const {
    url,
    countries: countriesParam,
    timeout: timeoutParam,
    mock,
    mode,
  } = params;

  if (!url) {
    throw new Error('URL parameter is required');
  }

  if (!validateUrl(url)) {
    throw new Error('Invalid URL format');
  }

  if (mock === '1') {
    return { ...MOCK_CHECK_RESPONSE, url } as CheckResponse;
  }

  const supportedCountries = ALL_COUNTRIES.map(c => c.code);
  const { isValid, countries, invalidCountries } = validateCountries(
    countriesParam ?? null,
    supportedCountries
  );
  if (!isValid) {
    throw new Error(`Unsupported countries: ${invalidCountries.join(', ')}`);
  }

  const finalCountries = countries.length > 0 ? countries : supportedCountries;
  const timeout = validateTimeout(timeoutParam ?? null);

  const useHead = mode === 'quick';
  const results = await checkWebsiteFromCountries(
    url,
    finalCountries,
    timeout,
    {
      useHead,
      maxRedirects: useHead ? 0 : 5,
    }
  );
  return createApiResponse(url, results);
}

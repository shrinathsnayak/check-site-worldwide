'use server';

import type { CheckResponse } from '@/types/types';
import { MOCK_CHECK_RESPONSE } from '@/mocks/checkResponse';
import { headers } from 'next/headers';

export async function getCheckResults(params: {
  url: string;
  countries?: string; // comma separated
  mock?: string; // '1' to enable mock
}): Promise<CheckResponse> {
  const { url, countries: countriesParam, mock } = params;

  if (!url) {
    throw new Error('URL parameter is required');
  }

  if (mock === '1') {
    return { ...MOCK_CHECK_RESPONSE, url } as CheckResponse;
  }

  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;

  const qs = new URLSearchParams();
  qs.set('url', url);
  if (countriesParam) qs.set('countries', countriesParam);
  // timeout and mode removed from API layer

  const res = await fetch(`${origin}/api/check?${qs.toString()}`.toString(), {
    next: { revalidate: 60 * 60 },
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message || body?.error || message;
    } catch {}
    throw new Error(message);
  }

  return (await res.json()) as CheckResponse;
}

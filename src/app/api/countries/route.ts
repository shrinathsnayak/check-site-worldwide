import { NextResponse } from 'next/server';
import type { CountriesResponse } from '@/types/types';
import { ALL_COUNTRIES } from '@/utils/countries';
import { error } from '@/utils/logger';
import { getCountryFlagFromISOCode } from '@/utils/utils';

export async function GET() {
  try {
    // Group countries by region
    const resultsByRegion = ALL_COUNTRIES.reduce(
      (acc, country) => {
        if (!acc[country.region]) {
          acc[country.region] = [];
        }
        acc[country.region].push({
          code: country.code,
          name: country.name,
          continent: country.continent,
          supported: country.supported,
          flag: getCountryFlagFromISOCode(country.code),
        });
        return acc;
      },
      {} as Record<
        string,
        Array<{
          code: string;
          name: string;
          continent: string;
          supported: boolean;
          flag: string;
        }>
      >
    );

    const response: CountriesResponse = {
      success: true,
      resultsByRegion: resultsByRegion,
    };

    return NextResponse.json(response);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    error(
      'Error fetching countries',
      'api-countries',
      err instanceof Error ? err : new Error(errorMessage)
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch countries',
        message:
          'An error occurred while fetching the list of supported countries',
        status: 500,
      },
      { status: 500 }
    );
  }
}

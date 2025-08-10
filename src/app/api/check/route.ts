import { checkWebsiteFromCountries } from '@/services/website-checker';
import { NextRequest, NextResponse } from 'next/server';
import { validateUrl, validateCountries } from '@/validation/validation';
import { createErrorResponse } from '@/validation/errors';
import { ALL_COUNTRIES } from '@/utils/countries';
import { createApiResponse } from '@/utils/response';
import { info, error } from '@/utils/logger';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const countriesParam = searchParams.get('countries');
    // timeout and mode are no longer accepted via API

    // Validate required parameters
    if (!url) {
      return NextResponse.json(
        createErrorResponse(
          'URL parameter is required',
          'Missing required parameter: url',
          400
        ),
        { status: 400 }
      );
    }

    // Validate URL format
    if (!validateUrl(url)) {
      return NextResponse.json(
        createErrorResponse('Invalid URL format', 'Invalid URL', 400),
        { status: 400 }
      );
    }

    // Parse and validate countries
    const countries = countriesParam ? countriesParam.split(',') : [];
    const supportedCountries = ALL_COUNTRIES.map(country => country.code);
    const countriesValidation = validateCountries(
      countriesParam,
      supportedCountries
    );
    if (!countriesValidation.isValid) {
      return NextResponse.json(
        createErrorResponse(
          'Invalid countries parameter',
          `Unsupported countries: ${countriesValidation.invalidCountries.join(', ')}`,
          400
        ),
        { status: 400 }
      );
    }

    // Use a sensible default timeout for all checks
    const timeout = 10000; // 10 seconds

    // If no countries specified, use all available countries
    const targetCountries =
      countries.length > 0
        ? countries
        : ALL_COUNTRIES.map(country => country.code);

    info(
      `Starting website accessibility check for ${url} from ${targetCountries.length} countries`,
      'api-check'
    );

    // Check website accessibility from all specified countries
    const results = await checkWebsiteFromCountries(
      url,
      targetCountries,
      timeout,
      {
        useHead: true,
        maxRedirects: 0,
      }
    );

    // Create API response using centralized function
    const apiResponse = createApiResponse(url, results);

    return NextResponse.json(apiResponse);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    error(
      'Error in website accessibility check',
      'api-check',
      err instanceof Error ? err : new Error(errorMessage)
    );

    return NextResponse.json(
      createErrorResponse(
        'Internal server error',
        'An unexpected error occurred while checking website accessibility',
        500
      ),
      { status: 500 }
    );
  }
}

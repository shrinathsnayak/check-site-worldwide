import { checkWebsiteFromCountries } from '@/services/website-checker';
import { NextRequest, NextResponse } from 'next/server';
import { validateUrl, validateCountries } from '@/validation/validation';
import { createErrorResponse } from '@/validation/errors';
import { ALL_COUNTRIES } from '@/utils/countries';
import { createApiResponse } from '@/utils/response';
import { info, error } from '@/utils/logger';
import type { CheckResult } from '@/types/types';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const countriesParam = searchParams.get('countries');
    const stream = searchParams.get('stream') === 'true';
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
      `Starting website accessibility check for ${url} from ${targetCountries.length} countries (streaming: ${stream})`,
      'api-check'
    );

    // Handle streaming vs non-streaming responses
    if (stream) {
      return handleStreamingRequest(url, targetCountries, timeout);
    }

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

async function handleStreamingRequest(
  url: string,
  targetCountries: string[],
  timeout: number
): Promise<Response> {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial metadata
      const initData = {
        type: 'init',
        data: {
          url,
          totalCountries: targetCountries.length,
          countries: targetCountries.map(code => {
            const country = ALL_COUNTRIES.find(c => c.code === code);
            return {
              code,
              name: country?.name || code,
              region: country?.region || 'Unknown'
            };
          })
        }
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(initData)}\n\n`));
    },

    async pull(controller) {
      try {
        // Start checking countries with streaming callback
        await checkWebsiteFromCountries(
          url,
          targetCountries,
          timeout,
          {
            useHead: true,
            maxRedirects: 0,
          },
          (result: CheckResult) => {
            // Stream each result as it completes
            const resultData = {
              type: 'result',
              data: result
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(resultData)}\n\n`)
            );
          }
        );

        // Send completion event
        const completeData = {
          type: 'complete',
          data: { timestamp: new Date().toISOString() }
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(completeData)}\n\n`)
        );
        controller.close();
      } catch (err) {
        const errorData = {
          type: 'error',
          data: {
            message: err instanceof Error ? err.message : 'Unknown error'
          }
        };
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`)
        );
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

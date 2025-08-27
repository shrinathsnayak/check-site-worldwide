import { checkWebsiteFromCountries } from '@/services/website-checker';
import { NextRequest, NextResponse } from 'next/server';
import { validateUrl, validateCountries } from '@/validation/validation';
import { createErrorResponse } from '@/validation/errors';
import { ALL_COUNTRIES } from '@/utils/countries';
import { info, error } from '@/utils/logger';
import type { CheckResult } from '@/types/types';
import {
  getCachedResults,
  setCachedResults,
  updateCachedResults,
} from '@/cache/results-redis';

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const countriesParam = searchParams.get('countries');
    // Always use streaming - no parameter needed

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
      `Starting website accessibility check for ${url} from ${targetCountries.length} countries (streaming)`,
      'api-check'
    );

    // Always use streaming
    return handleStreamingRequest(url, targetCountries, timeout);
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

  const countries =
    targetCountries.length === ALL_COUNTRIES.length
      ? undefined
      : targetCountries;

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const safeEnqueue = (data: string) => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(data));
          } catch (err) {
            isClosed = true;
            console.warn('Stream controller already closed:', err);
          }
        }
      };

      const safeClose = () => {
        if (!isClosed) {
          isClosed = true;
          controller.close();
        }
      };

      try {
        // Check Redis cache first
        const cachedResults = await getCachedResults(url, countries);

        if (cachedResults && cachedResults.length >= targetCountries.length) {
          info(
            `Using cached results for streaming ${url} (${cachedResults.length} countries)`,
            'api-check'
          );

          // Send cached data event - this tells client to skip loading
          const cachedData = {
            type: 'cached',
            data: {
              url,
              totalCountries: targetCountries.length,
              results: cachedResults,
              countries: targetCountries.map(code => {
                const country = ALL_COUNTRIES.find(c => c.code === code);
                return {
                  code,
                  name: country?.name || code,
                  region: country?.region || 'Unknown',
                };
              }),
            },
          };
          safeEnqueue(`data: ${JSON.stringify(cachedData)}\n\n`);

          // Send completion event
          const completeData = {
            type: 'complete',
            data: { timestamp: new Date().toISOString() },
          };
          safeEnqueue(`data: ${JSON.stringify(completeData)}\n\n`);
          safeClose();
          return;
        }

        // Send initial metadata for fresh check
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
                region: country?.region || 'Unknown',
              };
            }),
          },
        };
        safeEnqueue(`data: ${JSON.stringify(initData)}\n\n`);

        // Start checking countries with streaming callback
        const allResults: CheckResult[] = [];
        let completedCount = 0;

        const results = await checkWebsiteFromCountries(
          url,
          targetCountries,
          timeout,
          {
            useHead: true,
            maxRedirects: 0,
          },
          (result: CheckResult) => {
            if (isClosed) return; // Skip if stream is closed

            // Add to results array
            allResults.push(result);
            completedCount++;

            // Update Redis cache with partial result (don't await - fire and forget)
            updateCachedResults(url, result, countries).catch(error => {
              console.warn('Error updating cache:', error);
            });

            // Stream each result as it completes
            const resultData = {
              type: 'result',
              data: result,
            };
            safeEnqueue(`data: ${JSON.stringify(resultData)}\n\n`);

            info(
              `Streamed result ${completedCount}/${targetCountries.length} for ${result.country}`,
              'api-check'
            );
          }
        );

        // Ensure we have all results before completing
        info(
          `All ${results.length} countries completed, finalizing stream`,
          'api-check'
        );

        // Cache final complete results
        await setCachedResults(url, results, countries);

        // Send completion event only after all results are processed
        const completeData = {
          type: 'complete',
          data: {
            timestamp: new Date().toISOString(),
            totalProcessed: results.length,
            totalExpected: targetCountries.length,
          },
        };
        safeEnqueue(`data: ${JSON.stringify(completeData)}\n\n`);
        safeClose();
      } catch (err) {
        const errorData = {
          type: 'error',
          data: {
            message: err instanceof Error ? err.message : 'Unknown error',
          },
        };
        safeEnqueue(`data: ${JSON.stringify(errorData)}\n\n`);
        safeClose();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

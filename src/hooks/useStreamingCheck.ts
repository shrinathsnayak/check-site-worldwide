'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { StreamingState, StreamingEvent, CheckResult } from '@/types/types';
import { ALL_COUNTRIES } from '@/utils/countries';
import { streamingCache } from '@/cache/streaming-cache';

export function useStreamingCheck() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    totalCountries: 0,
    completedCountries: 0,
    results: [],
    error: null,
    countries: [],
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStreaming = useCallback(
    (url: string, countries?: string[]) => {
      // Check for cached results first
      const cachedResults = streamingCache.get(url, countries);

      // Reset state with cached results if available
      setState({
        isStreaming: true,
        totalCountries: 0,
        completedCountries: cachedResults?.length || 0,
        results: cachedResults || [],
        error: null,
        countries: [],
      });

      // If we have complete cached results, don't start streaming
      const expectedCountries = countries?.length || ALL_COUNTRIES.length;
      if (cachedResults && cachedResults.length >= expectedCountries) {
        setState(prev => ({
          ...prev,
          isStreaming: false,
          totalCountries: expectedCountries,
          countries: cachedResults.map(result => {
            const country = ALL_COUNTRIES.find(c => c.code === result.country);
            return {
              code: result.country,
              name: country?.name || result.country,
              region: country?.region || 'Unknown',
              status: result.accessible ? 'completed' : 'error',
              result,
            };
          }),
        }));
        return;
      }

      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Abort existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Build query parameters
      const params = new URLSearchParams();
      params.set('url', url);
      params.set('stream', 'true');
      if (countries && countries.length > 0) {
        params.set('countries', countries.join(','));
      }

      // Create EventSource connection
      const eventSource = new EventSource(`/api/check?${params.toString()}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const streamingEvent: StreamingEvent = JSON.parse(event.data);

          switch (streamingEvent.type) {
            case 'init': {
              const initData = streamingEvent.data as any;
              setState(prev => ({
                ...prev,
                totalCountries: initData.totalCountries,
                countries: initData.countries.map((country: any) => ({
                  ...country,
                  status: 'loading' as const,
                })),
              }));
              break;
            }

            case 'result': {
              const result = streamingEvent.data as CheckResult;

              // Update cache with new result
              streamingCache.updatePartial(url, result, countries);

              setState(prev => ({
                ...prev,
                completedCountries: prev.completedCountries + 1,
                results: [...prev.results, result],
                countries: prev.countries.map(country =>
                  country.code === result.country
                    ? {
                      ...country,
                      status: result.accessible ? 'completed' : 'error',
                      result,
                    }
                    : country
                ),
              }));
              break;
            }

            case 'complete': {
              setState(prev => {
                // Cache final results
                streamingCache.set(url, prev.results, countries);

                return {
                  ...prev,
                  isStreaming: false,
                };
              });
              eventSource.close();
              break;
            }

            case 'error': {
              const errorData = streamingEvent.data as any;
              setState(prev => ({
                ...prev,
                isStreaming: false,
                error: errorData.message,
              }));
              eventSource.close();
              break;
            }
          }
        } catch (err) {
          console.error('Error parsing streaming event:', err);
          setState(prev => ({
            ...prev,
            isStreaming: false,
            error: 'Failed to parse streaming response',
          }));
          eventSource.close();
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        setState(prev => ({
          ...prev,
          isStreaming: false,
          error: 'Connection error occurred',
        }));
        eventSource.close();
      };
    },
    []
  );

  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isStreaming: false,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  // Helper to get results grouped by region
  const getResultsByRegion = useCallback(() => {
    const resultsByRegion: Record<string, CheckResult[]> = {};

    state.results.forEach(result => {
      const country = ALL_COUNTRIES.find(c => c.code === result.country);
      const region = country?.region || 'Unknown';

      if (!resultsByRegion[region]) {
        resultsByRegion[region] = [];
      }
      resultsByRegion[region].push(result);
    });

    return resultsByRegion;
  }, [state.results]);

  const clearCache = useCallback((url: string, countries?: string[]) => {
    streamingCache.clear(url, countries);
  }, []);

  const clearAllCache = useCallback(() => {
    streamingCache.clearAll();
  }, []);

  return {
    ...state,
    startStreaming,
    stopStreaming,
    getResultsByRegion,
    clearCache,
    clearAllCache,
    progress: state.totalCountries > 0 ? state.completedCountries / state.totalCountries : 0,
  };
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { StreamingState, StreamingEvent, CheckResult } from '@/types/types';
import { ALL_COUNTRIES } from '@/utils/countries';

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
      // Reset state - server will handle caching
      setState({
        isStreaming: true,
        totalCountries: 0,
        completedCountries: 0,
        results: [],
        error: null,
        countries: [],
      });

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
            case 'cached': {
              const cachedData = streamingEvent.data as any;
              // Instantly show cached results - no loading state
              setState(prev => ({
                ...prev,
                isStreaming: false, // No loading for cached results
                totalCountries: cachedData.totalCountries,
                completedCountries: cachedData.results.length,
                results: cachedData.results,
                countries: cachedData.countries.map((country: any) => {
                  const result = cachedData.results.find((r: CheckResult) => r.country === country.code);
                  return {
                    ...country,
                    status: 'completed' as const,
                    result,
                  };
                }),
              }));
              break;
            }

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

              setState(prev => {
                const newCompletedCount = prev.completedCountries + 1;
                console.log(`📊 Received result ${newCompletedCount}/${prev.totalCountries} for ${result.country}`);

                return {
                  ...prev,
                  completedCountries: newCompletedCount,
                  results: [...prev.results, result],
                  countries: prev.countries.map(country =>
                    country.code === result.country
                      ? {
                        ...country,
                        status: 'completed',
                        result,
                      }
                      : country
                  ),
                };
              });
              break;
            }

            case 'complete': {
              const completeData = streamingEvent.data as any;
              console.log(`✅ Stream completed: ${completeData.totalProcessed}/${completeData.totalExpected} countries processed`);

              setState(prev => {
                // Only mark as complete if we have received all expected results
                const expectedCount = prev.totalCountries;
                const actualCount = prev.completedCountries;

                if (expectedCount > 0 && actualCount < expectedCount) {
                  console.warn(`⚠️ Stream marked complete but missing results: ${actualCount}/${expectedCount}`);
                  console.warn(`Missing countries:`, prev.countries.filter(c => c.status !== 'completed').map(c => c.code));

                  // Don't mark as complete yet - keep streaming indicator
                  return prev;
                }

                console.log(`✅ All ${actualCount} results received, marking as complete`);
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

  return {
    ...state,
    startStreaming,
    stopStreaming,
    getResultsByRegion,
    progress: state.totalCountries > 0 ? state.completedCountries / state.totalCountries : 0,
  };
}

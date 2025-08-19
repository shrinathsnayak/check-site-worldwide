import type { CheckResult, StreamingState } from '@/types/types';

// Client-side cache for streaming results
class StreamingResultsCache {
  private cache = new Map<string, {
    results: CheckResult[];
    timestamp: number;
    ttl: number;
  }>();

  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  // Generate cache key from URL and countries
  private getCacheKey(url: string, countries?: string[]): string {
    const countriesKey = countries?.sort().join(',') || 'all';
    return `${url}:${countriesKey}`;
  }

  // Check if cache entry is valid
  private isValid(entry: { timestamp: number; ttl: number }): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // Get cached results
  get(url: string, countries?: string[]): CheckResult[] | null {
    const key = this.getCacheKey(url, countries);
    const entry = this.cache.get(key);

    if (entry && this.isValid(entry)) {
      return entry.results;
    }

    return null;
  }

  // Set cached results
  set(url: string, results: CheckResult[], countries?: string[], ttl?: number): void {
    const key = this.getCacheKey(url, countries);
    this.cache.set(key, {
      results,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    });
  }

  // Update cache with partial results (for streaming)
  updatePartial(url: string, result: CheckResult, countries?: string[]): void {
    const key = this.getCacheKey(url, countries);
    const existing = this.cache.get(key);

    if (existing && this.isValid(existing)) {
      // Update existing result or add new one
      const updatedResults = existing.results.filter(r => r.country !== result.country);
      updatedResults.push(result);

      this.cache.set(key, {
        ...existing,
        results: updatedResults,
        timestamp: Date.now(), // Update timestamp
      });
    } else {
      // Create new cache entry with single result
      this.set(url, [result], countries);
    }
  }

  // Clear cache for specific URL
  clear(url: string, countries?: string[]): void {
    const key = this.getCacheKey(url, countries);
    this.cache.delete(key);
  }

  // Clear all cache
  clearAll(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Clean expired entries
  cleanup(): number {
    let cleanedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    return cleanedCount;
  }
}

// Export singleton instance
export const streamingCache = new StreamingResultsCache();

// Hook to automatically clean up cache periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    streamingCache.cleanup();
  }, 60000); // Clean up every minute
}

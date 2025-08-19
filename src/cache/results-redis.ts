import { Redis } from '@upstash/redis';
import type { CheckResult } from '@/types/types';
import { info, debug } from '@/utils/logger';

const redis = Redis.fromEnv();

// Cache configuration
const CACHE_PREFIX = 'website-checker:results';
const DEFAULT_TTL_SECONDS = 2 * 24 * 60 * 60; // 2 days

// Generate cache key from URL and countries
function getCacheKey(url: string, countries?: string[]): string {
  const countriesKey = countries?.sort().join(',') || 'all';
  return `${CACHE_PREFIX}:${url}:${countriesKey}`;
}

// Get cached results from Redis
export async function getCachedResults(
  url: string,
  countries?: string[]
): Promise<CheckResult[] | null> {
  try {
    const key = getCacheKey(url, countries);
    const value = await redis.get<CheckResult[]>(key);

    if (value && Array.isArray(value)) {
      info(
        `📦 (Redis) Loaded ${value.length} cached results for ${url}`,
        'results-cache'
      );
      return value;
    }

    debug(`No cached results found for ${url}`, 'results-cache');
    return null;
  } catch (err) {
    debug(
      `Redis get error for ${url}: ${err instanceof Error ? err.message : String(err)}`,
      'results-cache'
    );
    return null;
  }
}

// Set cached results in Redis
export async function setCachedResults(
  url: string,
  results: CheckResult[],
  countries?: string[],
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<void> {
  try {
    const key = getCacheKey(url, countries);
    await redis.set(key, results, { ex: ttlSeconds });

    info(
      `💾 (Redis) Cached ${results.length} results for ${url} (TTL: ${ttlSeconds}s)`,
      'results-cache'
    );
  } catch (err) {
    debug(
      `Redis set error for ${url}: ${err instanceof Error ? err.message : String(err)}`,
      'results-cache'
    );
  }
}

// Update cache with partial results (for streaming)
export async function updateCachedResults(
  url: string,
  newResult: CheckResult,
  countries?: string[]
): Promise<void> {
  try {
    const key = getCacheKey(url, countries);
    const existing = await redis.get<CheckResult[]>(key);

    if (existing && Array.isArray(existing)) {
      // Update existing result or add new one
      const updatedResults = existing.filter(r => r.country !== newResult.country);
      updatedResults.push(newResult);

      // Keep the original TTL by getting current TTL and setting it again
      const ttl = await redis.ttl(key);
      const ttlSeconds = ttl > 0 ? ttl : DEFAULT_TTL_SECONDS;

      await redis.set(key, updatedResults, { ex: ttlSeconds });

      debug(
        `🔄 (Redis) Updated cached result for ${newResult.country} in ${url}`,
        'results-cache'
      );
    } else {
      // Create new cache entry with single result
      await setCachedResults(url, [newResult], countries);
    }
  } catch (err) {
    debug(
      `Redis update error for ${url}: ${err instanceof Error ? err.message : String(err)}`,
      'results-cache'
    );
  }
}

// Clear cached results for specific URL
export async function clearCachedResults(
  url: string,
  countries?: string[]
): Promise<boolean> {
  try {
    const key = getCacheKey(url, countries);
    const result = await redis.del(key);
    const deleted = typeof result === 'number' ? result : Number(result ?? 0);

    if (deleted > 0) {
      info(`🗑️ (Redis) Cleared cached results for ${url}`, 'results-cache');
      return true;
    }

    return false;
  } catch (err) {
    debug(
      `Redis delete error for ${url}: ${err instanceof Error ? err.message : String(err)}`,
      'results-cache'
    );
    return false;
  }
}

// Clear all cached results
export async function clearAllCachedResults(): Promise<number> {
  try {
    // Get all keys matching our pattern
    const pattern = `${CACHE_PREFIX}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      info('🗑️ (Redis) No cached results to clear', 'results-cache');
      return 0;
    }

    // Delete all matching keys
    const result = await redis.del(...keys);
    const deleted = typeof result === 'number' ? result : Number(result ?? 0);

    info(`🗑️ (Redis) Cleared ${deleted} cached result entries`, 'results-cache');
    return deleted;
  } catch (err) {
    debug(
      `Redis clear-all error: ${err instanceof Error ? err.message : String(err)}`,
      'results-cache'
    );
    return 0;
  }
}

// Get cache statistics
export async function getCacheStats(): Promise<{
  totalEntries: number;
  keys: string[];
}> {
  try {
    const pattern = `${CACHE_PREFIX}:*`;
    const keys = await redis.keys(pattern);

    return {
      totalEntries: keys.length,
      keys: keys.map(key => key.replace(`${CACHE_PREFIX}:`, '')),
    };
  } catch (err) {
    debug(
      `Redis stats error: ${err instanceof Error ? err.message : String(err)}`,
      'results-cache'
    );
    return {
      totalEntries: 0,
      keys: [],
    };
  }
}

// Check if results are cached and valid
export async function hasCachedResults(
  url: string,
  countries?: string[]
): Promise<boolean> {
  try {
    const key = getCacheKey(url, countries);
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (err) {
    debug(
      `Redis exists error for ${url}: ${err instanceof Error ? err.message : String(err)}`,
      'results-cache'
    );
    return false;
  }
}

// Centralized caching system for the project
import { logCacheOperation } from '../utils/utils';
import type { PaidProxy, CheckResult } from '../types/types';
import { info } from '../utils/logger';

// Generic cache entry interface
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Cache configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 60 * 60 * 1000, // 1 hour in milliseconds
  PROXY_CACHE_TTL: 60 * 60 * 1000, // 1 hour for proxy data
  WEBSITE_CHECK_TTL: 5 * 60 * 1000, // 5 minutes for website check results
  RATE_LIMIT_TTL: 60 * 1000, // 1 minute for rate limiting
} as const;

// Generic cache class
export class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTtl: number;

  constructor(defaultTtl: number = CACHE_CONFIG.DEFAULT_TTL) {
    this.defaultTtl = defaultTtl;
  }

  // Generate cache key from parameters
  private getCacheKey(params: string[]): string {
    return params.length > 0 ? params.sort().join(',') : 'all';
  }

  // Check if cache entry is valid
  private isCacheValid(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // Get cached data
  get(key: string | string[]): T | null {
    const cacheKey = typeof key === 'string' ? key : this.getCacheKey(key);
    const entry = this.cache.get(cacheKey);

    if (entry && this.isCacheValid(entry)) {
      logCacheOperation(
        'Using cached data',
        typeof key === 'string' ? [key] : key,
        entry.data
      );
      return entry.data;
    }

    return null;
  }

  // Set cached data
  set(key: string | string[], data: T, ttl?: number): void {
    const cacheKey = typeof key === 'string' ? key : this.getCacheKey(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
    };

    this.cache.set(cacheKey, entry);
    logCacheOperation(
      'Cached data',
      typeof key === 'string' ? [key] : key,
      data
    );
  }

  // Check if key exists and is valid
  has(key: string | string[]): boolean {
    const cacheKey = typeof key === 'string' ? key : this.getCacheKey(key);
    const entry = this.cache.get(cacheKey);
    return entry ? this.isCacheValid(entry) : false;
  }

  // Delete cache entry
  delete(key: string | string[]): boolean {
    const cacheKey = typeof key === 'string' ? key : this.getCacheKey(key);
    return this.cache.delete(cacheKey);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    info('🗑️ Cleared cache', 'cache');
  }

  // Get cache statistics
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  // Clean expired entries
  cleanup(): number {
    let cleanedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isCacheValid(entry)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      info(`🧹 Cleaned ${cleanedCount} expired cache entries`, 'cache');
    }
    return cleanedCount;
  }
}

// Specialized cache instances
export const proxyCache = new Cache<PaidProxy[]>(CACHE_CONFIG.PROXY_CACHE_TTL);
export const websiteCheckCache = new Cache<CheckResult[]>(
  CACHE_CONFIG.WEBSITE_CHECK_TTL
);
export const rateLimitCache = new Cache<number>(CACHE_CONFIG.RATE_LIMIT_TTL);

// Helper function to get cache key for different contexts
export function getCacheKey(_context: string, params: string[]): string {
  return `${_context}:${params.sort().join(',')}`;
}

// Helper function to check if cache should be used
export function shouldUseCache(context: string): boolean {
  // Add logic here to determine if caching should be enabled
  // For example, disable in development mode
  return (
    process.env.NODE_ENV === 'production' || process.env.ENABLE_CACHE === 'true'
  );
}

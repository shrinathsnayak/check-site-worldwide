// Proxy configuration constants - PAID PROXIES ONLY
export const PROXY_CONFIG = {
  TEST_TIMEOUT: 3000, // Optimized for paid proxies
  MAX_PROXIES_PER_COUNTRY: 1, // Fewer needed with paid proxies
  MAX_CONCURRENT_PROXY_TESTS: 20, // Optimized for paid proxies
  MAX_CONCURRENT_COUNTRY_CHECKS: 20, // Lowered for Brightdata rate limiting
  PROXY_TEST_URL: 'http://httpbin.org/ip',
  // Request headers for better compatibility
  USER_AGENT: 'Check-Site-Worldwide/1.0', // Updated for project rename
  ACCEPT: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  ACCEPT_LANGUAGE: 'en-US,en;q=0.5',
  ACCEPT_ENCODING: 'gzip, deflate',
  CONNECTION: 'keep-alive',
  UPGRADE_INSECURE_REQUESTS: '1',
  // Paid proxy optimizations
  SKIP_PROXY_TEST_ON_CACHE_HIT: true, // Paid proxies are reliable
  MAX_PROXY_SEARCH_TIME: 5000, // Faster search for paid proxies
  FAST_FAIL_TIMEOUT: 3000, // Faster failure detection
  // Cache settings
  CACHE_PREFIX: 'paid_proxy',
  CACHE_TTL: 3600, // 1 hour cache TTL
} as const;

// Rate limiting configuration
export const RATE_LIMIT_WINDOW = 60000; // 1 minute window
export const MAX_REQUESTS_PER_WINDOW = 10; // Max requests per window

// Paid proxy service configuration - WEBSHARE
export const PAID_PROXY_CONFIG = {
  service: 'webshare', // Using Webshare proxy service
  apiKey: process.env.WEBSHARE_API_KEY || '',
  // Webshare specific settings
  baseUrl: 'https://proxy.webshare.io/api/v2',
  // Connection settings
  timeout: 10000, // Reasonable timeout for Webshare
  maxRetries: 3, // Fewer retries for Webshare
  // Geographic targeting - will be populated from countries.ts
  targetCountries: [], // Will be populated dynamically
} as const;

// Logger constants
import { LogLevel } from '../types/types';

export const LOG_LEVEL_NAMES = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.FATAL]: 'FATAL',
} as const;

export const LOG_LEVEL_EMOJIS = {
  [LogLevel.DEBUG]: '🔍',
  [LogLevel.INFO]: 'ℹ️',
  [LogLevel.WARN]: '⚠️',
  [LogLevel.ERROR]: '❌',
  [LogLevel.FATAL]: '💀',
} as const;

export const LOGGER_CONFIG = {
  DEFAULT_LEVEL: LogLevel.INFO,
  DEFAULT_CONSOLE: true,
  DEFAULT_FORMAT: 'text' as const,
  DEFAULT_TIMESTAMP: true,
  DEFAULT_LEVEL_DISPLAY: true,
  DEFAULT_CONTEXT: true,
} as const;

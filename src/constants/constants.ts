// Logger constants
import { LogLevel } from '@/types/types';
// Proxy configuration constants - PAID PROXIES ONLY
export const PROXY_CONFIG = {
  TEST_TIMEOUT: 7000,
  MAX_PROXIES_PER_COUNTRY: 3,
  MAX_CONCURRENT_PROXY_TESTS: 10,
  MAX_CONCURRENT_COUNTRY_CHECKS: 15,
  PROXY_TEST_URL: 'http://httpbin.org/ip',
  // Request headers for better compatibility
  USER_AGENT: 'Check-Site-Worldwide/1.0', // Updated for project rename
  ACCEPT: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  ACCEPT_LANGUAGE: 'en-US,en;q=0.5',
  ACCEPT_ENCODING: 'gzip, deflate',
  CONNECTION: 'keep-alive',
  UPGRADE_INSECURE_REQUESTS: '1',
  // Proxy optimizations
  SKIP_PROXY_TEST_ON_CACHE_HIT: true,
  MAX_PROXY_SEARCH_TIME: 10000,
  FAST_FAIL_TIMEOUT: 6000,
  // Retry configuration
  MAX_RETRIES: 2, // Add retry logic for failed proxies
  RETRY_DELAY: 1000, // 1 second delay between retries
  // Cache settings
  CACHE_PREFIX: 'paid_proxy',
  CACHE_TTL: 3600, // 1 hour cache TTL
} as const;

// Rate limiting configuration
export const RATE_LIMIT_WINDOW = 60000; // 1 minute window
export const MAX_REQUESTS_PER_WINDOW = 10; // Max requests per window

// Proxy service configuration - WEBSHARE
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

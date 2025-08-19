export interface CheckResult {
  country: string;
  countryName: string;
  region: string;
  accessible: boolean;
  responseTime: number;
  statusCode: number;
  error?: string;
  usedIp?: string;
  timestamp: string;
  // Additional timing metrics
  timings?: {
    dnsFetch?: number;    // DNS lookup time
    connect?: number;     // TCP connection time
    tls?: number;         // TLS handshake time
    ttfb?: number;        // Time to First Byte
    transfer?: number;    // Content transfer time
    latency?: number;     // Network latency
  };
}

// CheckSummary and CheckResponse removed - no longer needed for streaming-only approach

export interface CountryInfo {
  code: string;
  name: string;
  region: string;
  continent: string;
  supported: boolean; // Flag to indicate if supported by Webshare
}

export interface CountriesResponse {
  success: boolean;
  resultsByRegion: Record<
    string,
    Array<{
      code: string;
      name: string;
      continent: string;
      supported: boolean;
      flag: string;
    }>
  >;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  status: number;
  details?: unknown;
  supportedCountries?: string[];
}

export interface PaidProxy {
  host: string;
  port: number;
  country: string;
  region: string;
  protocol: 'http' | 'https';
  anonymity: 'elite' | 'anonymous' | 'transparent';
  lastChecked: string;
  uptime: number;
  // Authentication fields for paid proxies
  username?: string;
  password?: string;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Logger types
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  format: 'json' | 'text';
  includeTimestamp: boolean;
  includeLevel: boolean;
  includeContext: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  error?: Error;
}

// Interface for Webshare API response
export interface WebshareProxy {
  id: string;
  username: string;
  password: string;
  proxy_address: string;
  port: number;
  valid: boolean;
  last_verification: string;
  country_code: string;
  city_name: string;
  asn_name: string;
  asn_number: number;
  high_country_confidence: boolean;
  created_at: string;
}

export interface WebshareApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: WebshareProxy[];
}

// Streaming API Types
export interface StreamingInitData {
  url: string;
  totalCountries: number;
  countries: Array<{
    code: string;
    name: string;
    region: string;
  }>;
}

export interface StreamingEvent {
  type: 'init' | 'result' | 'complete' | 'error' | 'cached';
  data: StreamingInitData | CheckResult | { timestamp: string } | { message: string } | {
    url: string;
    totalCountries: number;
    results: CheckResult[];
    countries: Array<{
      code: string;
      name: string;
      region: string;
    }>;
  };
}

export interface StreamingState {
  isStreaming: boolean;
  totalCountries: number;
  completedCountries: number;
  results: CheckResult[];
  error: string | null;
  countries: Array<{
    code: string;
    name: string;
    region: string;
    status: 'pending' | 'loading' | 'completed' | 'error';
    result?: CheckResult;
  }>;
}

export type ViewMode = 'grid' | 'table';

// UI Types
export interface FeatureProps {
  icon: React.FC<{ size?: number; stroke?: number }>;
  title: React.ReactNode;
  description: React.ReactNode;
}

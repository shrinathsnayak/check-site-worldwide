/**
 * Options for website checking
 */
export interface CheckOptions {
  useHead?: boolean;
  maxRedirects?: number;
}

/**
 * Timing metrics for performance measurement
 */
export interface TimingMetrics {
  dnsFetch?: number;
  connect?: number;
  tls?: number;
  ttfb?: number;
  transfer?: number;
  latency?: number;
}

/**
 * Proxy authentication validation function type
 */
export type ProxyAuthValidator = (proxy: { username?: string; password?: string }) => boolean;

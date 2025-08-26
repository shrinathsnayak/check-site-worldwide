import type { PaidProxy } from '@/types/types';

/**
 * Validates proxy authentication credentials
 */
export function hasValidAuthentication(proxy: PaidProxy): boolean {
  return !!(
    proxy.username &&
    proxy.password &&
    proxy.username.trim() !== '' &&
    proxy.password.trim() !== ''
  );
}

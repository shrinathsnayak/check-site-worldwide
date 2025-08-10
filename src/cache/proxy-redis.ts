import { Redis } from '@upstash/redis';
import type { PaidProxy } from '@/types/types';
import { PROXY_CONFIG } from '@/constants/constants';
import { info, debug } from '@/utils/logger';

const redis = Redis.fromEnv();

function allWorkingKey(): string {
  return `${PROXY_CONFIG.CACHE_PREFIX}:working:all`;
}

export async function getAllWorkingProxiesFromRedis(): Promise<PaidProxy[]> {
  try {
    const key = allWorkingKey();
    const value = await redis.get<PaidProxy[]>(key);
    if (value && Array.isArray(value)) {
      info(
        `📦 (Redis) Loaded ${value.length} working proxies (all)`,
        'redis-cache'
      );
      return value as PaidProxy[];
    }
    return [];
  } catch (err) {
    debug(
      `Redis get error (all working): ${err instanceof Error ? err.message : String(err)}`,
      'redis-cache'
    );
    return [];
  }
}

export async function getWorkingProxiesForCountriesFromRedis(
  countries: string[]
): Promise<PaidProxy[]> {
  const all = await getAllWorkingProxiesFromRedis();
  if (!countries || countries.length === 0) return all;
  const set = new Set(countries.map(c => c.toUpperCase()));
  return all.filter(p => set.has(p.country?.toUpperCase?.() || ''));
}

export async function upsertWorkingProxiesForCountry(
  country: string,
  proxies: PaidProxy[],
  ttlSeconds: number = PROXY_CONFIG.CACHE_TTL
): Promise<void> {
  try {
    const key = allWorkingKey();
    const current = await getAllWorkingProxiesFromRedis();
    const filtered = current.filter(
      p => (p.country || '').toUpperCase() !== country.toUpperCase()
    );
    const limited = proxies.slice(0, PROXY_CONFIG.MAX_PROXIES_PER_COUNTRY);
    const updated = [...filtered, ...limited];
    await redis.set(key, updated, { ex: ttlSeconds });
    info(
      `💾 (Redis) Upserted ${limited.length} working proxies for ${country} (total ${updated.length})`,
      'redis-cache'
    );
  } catch (err) {
    debug(
      `Redis upsert error (${country}): ${err instanceof Error ? err.message : String(err)}`,
      'redis-cache'
    );
  }
}

export async function deleteAllWorkingProxiesFromRedis(): Promise<number> {
  try {
    const key = allWorkingKey();
    const res = await redis.del(key);
    const deleted = typeof res === 'number' ? res : Number(res ?? 0);
    info(`🗑️ (Redis) Cleared working proxies key (${deleted})`, 'redis-cache');
    return deleted;
  } catch (err) {
    debug(
      `Redis delete error (all): ${err instanceof Error ? err.message : String(err)}`,
      'redis-cache'
    );
    return 0;
  }
}

export async function getWorkingProxyStats(): Promise<{
  total: number;
  countries: Record<string, number>;
}> {
  const all = await getAllWorkingProxiesFromRedis();
  const perCountry: Record<string, number> = {};
  for (const p of all) {
    const c = (p.country || '').toUpperCase();
    perCountry[c] = (perCountry[c] || 0) + 1;
  }
  return { total: all.length, countries: perCountry };
}

export async function setAllWorkingProxies(
  proxies: PaidProxy[],
  ttlSeconds: number = PROXY_CONFIG.CACHE_TTL
): Promise<void> {
  try {
    const key = allWorkingKey();
    await redis.set(key, proxies, { ex: ttlSeconds });
    info(
      `💾 (Redis) Set all working proxies (${proxies.length})`,
      'redis-cache'
    );
  } catch (err) {
    debug(
      `Redis set-all error: ${err instanceof Error ? err.message : String(err)}`,
      'redis-cache'
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { proxyCache, websiteCheckCache } from '@/cache/cache';
import {
  deleteAllWorkingProxiesFromRedis,
  getWorkingProxyStats,
} from '@/cache/proxy-redis';
import {
  clearAllCachedResults,
  getCacheStats,
} from '@/cache/results-redis';
import { info } from '@/utils/logger';

export async function POST(request: NextRequest) {
  try {
    // Parse request body to get the authentication key
    const body = await request.json().catch(() => ({}));
    const { authKey } = body;

    // Get the expected authentication key from environment variables
    const expectedAuthKey = process.env.CACHE_CLEAR_AUTH_KEY;

    // Validate authentication
    if (!expectedAuthKey) {
      info('❌ Cache clear authentication key not configured', 'cache-clear');
      return NextResponse.json(
        {
          success: false,
          message: 'Cache clear authentication not configured',
          error: 'CACHE_CLEAR_AUTH_KEY environment variable not set',
        },
        { status: 500 }
      );
    }

    if (!authKey || authKey !== expectedAuthKey) {
      info(
        '❌ Invalid authentication key provided for cache clear',
        'cache-clear'
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid authentication key',
          error: 'Unauthorized access to cache clear endpoint',
        },
        { status: 401 }
      );
    }

    info('🗑️ Clearing all caches...', 'cache-clear');

    // Clear in-memory caches
    proxyCache.clear();
    websiteCheckCache.clear();

    // Clear Redis caches
    const deletedProxies = await deleteAllWorkingProxiesFromRedis();
    const deletedResults = await clearAllCachedResults();

    info('✅ All caches cleared successfully', 'cache-clear');

    return NextResponse.json({
      success: true,
      message: 'All caches cleared successfully',
      data: {
        cleared: true,
        cachesCleared: ['proxy', 'website-check', 'redis:working-proxies', 'redis:results'],
        redisDeleted: {
          proxies: deletedProxies,
          results: deletedResults,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    info(`❌ Failed to clear caches: ${errorMessage}`, 'cache-clear');

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to clear caches',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    info('📊 Getting cache statistics...', 'cache-stats');

    const proxyStats = proxyCache.getStats();
    const websiteCheckStats = websiteCheckCache.getStats();
    const redisProxyStats = await getWorkingProxyStats();
    const redisResultsStats = await getCacheStats();

    return NextResponse.json({
      success: true,
      message: 'Cache statistics retrieved',
      data: {
        proxy: {
          size: proxyStats.size,
          entries: proxyStats.entries,
        },
        websiteCheck: {
          size: websiteCheckStats.size,
          entries: websiteCheckStats.entries,
        },
        redisWorkingProxies: redisProxyStats,
        redisResults: redisResultsStats,
        total: {
          size: proxyStats.size + websiteCheckStats.size + redisProxyStats.total + redisResultsStats.totalEntries,
          entries: [...proxyStats.entries, ...websiteCheckStats.entries, ...redisResultsStats.keys],
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    info(`❌ Failed to get cache statistics: ${errorMessage}`, 'cache-stats');

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get cache statistics',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

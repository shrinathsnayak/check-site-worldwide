import { NextRequest, NextResponse } from 'next/server';
import { proxyCache, websiteCheckCache } from '@/cache/cache';
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

    // Clear both proxy cache and website check cache
    proxyCache.clear();
    websiteCheckCache.clear();

    info('✅ All caches cleared successfully', 'cache-clear');

    return NextResponse.json({
      success: true,
      message: 'All caches cleared successfully',
      data: {
        cleared: true,
        cachesCleared: ['proxy', 'website-check'],
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
        total: {
          size: proxyStats.size + websiteCheckStats.size,
          entries: [...proxyStats.entries, ...websiteCheckStats.entries],
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

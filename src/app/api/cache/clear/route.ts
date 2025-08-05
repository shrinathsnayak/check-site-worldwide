import { NextRequest, NextResponse } from 'next/server';
import { proxyCache, websiteCheckCache } from '@/cache/cache';
import { info } from '@/utils/logger';

export async function POST(_request: NextRequest) {
  try {
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

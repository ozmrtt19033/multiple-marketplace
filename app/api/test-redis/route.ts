// app/api/test-redis/route.ts
import { redis, getCached, checkRedisHealth } from '@/lib/redis';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const client = redis();

        // Health check
        const isHealthy = await checkRedisHealth();

        if (!isHealthy) {
            return NextResponse.json({
                success: false,
                message: '❌ Redis is not available',
                suggestion: 'Run: docker start redis-marketplace',
            }, { status: 503 });
        }

        // Test operations
        const pong = await client.ping();
        await client.set('test-key', 'Hello Redis! 🎉', 'EX', 60);
        const value = await client.get('test-key');

        // Cache function test
        const cachedData = await getCached(
            'test-cache',
            async () => ({
                message: 'This is cached!',
                timestamp: Date.now(),
            }),
            30
        );

        return NextResponse.json({
            success: true,
            redis_status: pong,
            test_value: value,
            cached_data: cachedData,
            message: '✅ Redis is working perfectly!',
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            message: '❌ Redis connection failed',
        }, { status: 500 });
    }
}
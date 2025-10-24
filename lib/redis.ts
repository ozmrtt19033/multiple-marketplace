// lib/redis.ts
import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedisClient(): Redis {
    if (redis && redis.status === 'ready') {
        return redis;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redis = new Redis(redisUrl, {
        maxRetriesPerRequest: null, // Önemli değişiklik!
        enableReadyCheck: false,
        retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        reconnectOnError() {
            return true;
        },
    });

    redis.on('error', (err) => {
        console.error('❌ Redis Error:', err.message);
    });

    redis.on('connect', () => {
        console.log('✅ Redis Connected');
    });

    redis.on('ready', () => {
        console.log('🚀 Redis Ready');
    });

    return redis;
}

export { getRedisClient as redis };

// Cache helper with better error handling
export async function getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300
): Promise<T> {
    const client = getRedisClient();

    try {
        // Check if Redis is available
        const cached = await client.get(key);

        if (cached) {
            console.log(`🎯 Cache HIT: ${key}`);
            return JSON.parse(cached) as T;
        }

        console.log(`❌ Cache MISS: ${key}`);
    } catch (error: any) {
        console.warn(`⚠️  Cache read failed for ${key}:`, error.message);
    }

    // Fetch data
    const data = await fetcher();

    // Try to cache (don't fail if Redis is down)
    try {
        const client = getRedisClient();
        await client.setex(key, ttl, JSON.stringify(data));
    } catch (error: any) {
        console.warn(`⚠️  Cache write failed for ${key}:`, error.message);
    }

    return data;
}

export async function invalidateCache(pattern: string) {
    try {
        const client = getRedisClient();
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
            await client.del(...keys);
            console.log(`🗑️  Invalidated ${keys.length} keys`);
        }
    } catch (error: any) {
        console.warn('⚠️  Cache invalidation failed:', error.message);
    }
}

export async function deleteCache(key: string) {
    try {
        const client = getRedisClient();
        await client.del(key);
        console.log(`🗑️  Deleted cache: ${key}`);
    } catch (error: any) {
        console.warn('⚠️  Cache deletion failed:', error.message);
    }
}

export async function checkRedisHealth(): Promise<boolean> {
    try {
        const client = getRedisClient();
        const result = await client.ping();
        return result === 'PONG';
    } catch (error) {
        return false;
    }
}
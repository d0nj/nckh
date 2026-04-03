import Redis from 'ioredis';
import type { Context, Next } from 'hono';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  totalLimit: number;
}

/**
 * Distributed rate limiting using Redis sliding window
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { windowMs, maxRequests, keyPrefix = 'ratelimit' } = config;
  const redisKey = `${keyPrefix}:${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const pipeline = redis.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  pipeline.zcard(redisKey);
  pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
  pipeline.pexpire(redisKey, windowMs);
  
  const results = await pipeline.exec();
  const currentCount = results?.[1]?.[1] as number || 0;
  
  const allowed = currentCount < maxRequests;
  const remaining = Math.max(0, maxRequests - currentCount - 1);
  const resetAt = now + windowMs;
  
  return { allowed, remaining, resetAt, totalLimit: maxRequests };
}

/**
 * Hono middleware for distributed rate limiting
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    const userId = c.get('userId') || 'anonymous';
    const key = `${userId}`;
    
    const result = await checkRateLimit(key, config);
    
    c.header('X-RateLimit-Limit', result.totalLimit.toString());
    c.header('X-RateLimit-Remaining', result.remaining.toString());
    c.header('X-RateLimit-Reset', Math.ceil(result.resetAt / 1000).toString());
    
    if (!result.allowed) {
      return c.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
      }, 429);
    }
    
    await next();
  };
}
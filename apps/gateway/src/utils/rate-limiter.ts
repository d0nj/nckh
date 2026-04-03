import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyPrefix?: string;    // Redis key prefix
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
  
  // Use Redis multi for atomic operations
  const pipeline = redis.pipeline();
  
  // Remove old entries outside the window
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  
  // Count current requests in window
  pipeline.zcard(redisKey);
  
  // Add current request
  pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
  
  // Set expiry on the key
  pipeline.pexpire(redisKey, windowMs);
  
  const results = await pipeline.exec();
  const currentCount = results?.[1]?.[1] as number || 0;
  
  const allowed = currentCount < maxRequests;
  const remaining = Math.max(0, maxRequests - currentCount - 1);
  const resetAt = now + windowMs;
  
  return {
    allowed,
    remaining,
    resetAt,
    totalLimit: maxRequests,
  };
}

/**
 * Get current rate limit status without incrementing
 */
export async function getRateLimitStatus(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { windowMs, maxRequests, keyPrefix = 'ratelimit' } = config;
  const redisKey = `${keyPrefix}:${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Remove old entries and count
  await redis.zremrangebyscore(redisKey, 0, windowStart);
  const currentCount = await redis.zcard(redisKey);
  
  const remaining = Math.max(0, maxRequests - currentCount);
  const resetAt = now + windowMs;
  
  return {
    allowed: remaining > 0,
    remaining,
    resetAt,
    totalLimit: maxRequests,
  };
}

/**
 * Reset rate limit for a key
 */
export async function resetRateLimit(key: string, keyPrefix = 'ratelimit'): Promise<void> {
  await redis.del(`${keyPrefix}:${key}`);
}
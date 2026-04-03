import type { Context, Next } from 'hono';
import type { RateLimitStore } from '../types/index.js';

const rateLimitStore: RateLimitStore = new Map();

export function createRateLimiter(limit: number) {
  return async (c: Context, next: Next) => {
    const role = c.get('userRole') || 'anonymous';
    const key = `ratelimit:${role}`;
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    let data = rateLimitStore.get(key);
    
    if (!data || data.resetAt < windowStart) {
      // Reset window
      data = { count: 0, resetAt: now };
    }
    
    if (data.count >= limit) {
      return c.json({
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Rate limit exceeded. Try again later.' }
      }, 429);
    }
    
    data.count++;
    rateLimitStore.set(key, data);
    
    // Set rate limit headers
    c.res.headers.set('X-RateLimit-Limit', limit.toString());
    c.res.headers.set('X-RateLimit-Remaining', Math.max(0, limit - data.count).toString());
    
    await next();
  };
}

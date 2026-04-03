import type { Context, Next } from 'hono';
import { checkRateLimit } from '../utils/rate-limiter';

export interface RateLimitMiddlewareConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (c: Context) => string;
}

/**
 * Hono middleware for distributed rate limiting
 */
export function createRateLimitMiddleware(config: RateLimitMiddlewareConfig) {
  const { windowMs, maxRequests, keyGenerator } = config;
  
  return async (c: Context, next: Next) => {
    // Generate key based on user role or IP
    const key = keyGenerator 
      ? keyGenerator(c)
      : c.get('userRole') || c.req.header('x-forwarded-for') || 'anonymous';
    
    const result = await checkRateLimit(key, {
      windowMs,
      maxRequests,
      keyPrefix: 'gateway',
    });
    
    // Set rate limit headers
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
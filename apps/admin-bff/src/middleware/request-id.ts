/**
 * Request ID middleware for BFF services
 */
import type { Context, Next } from 'hono';

export async function requestIdMiddleware(c: Context, next: Next) {
  const existingRequestId = c.req.header('X-Request-ID');
  const requestId = existingRequestId || crypto.randomUUID();
  
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);
  
  await next();
}

export function getRequestId(c: Context): string {
  return c.get('requestId') || 'unknown';
}
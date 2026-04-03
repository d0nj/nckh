import type { Context, Next } from 'hono';

/**
 * Request ID middleware - generates and propagates request IDs
 */
export async function requestIdMiddleware(c: Context, next: Next) {
  // Check for existing request ID from upstream
  const existingRequestId = c.req.header('X-Request-ID');
  
  // Generate new request ID or use existing
  const requestId = existingRequestId || crypto.randomUUID();
  
  // Store in context
  c.set('requestId', requestId);
  
  // Add to response headers
  c.header('X-Request-ID', requestId);
  
  await next();
}

/**
 * Get request ID from context
 */
export function getRequestId(c: Context): string {
  return c.get('requestId') || 'unknown';
}
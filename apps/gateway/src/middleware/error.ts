import type { Context } from 'hono';
import { getRequestId } from './request-id';

export function errorHandler(err: Error, c: Context) {
  const requestId = getRequestId(c);
  console.error(`[${requestId}] Gateway Error:`, err);

  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      requestId,
    }
  }, 500);
}

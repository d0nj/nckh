import type { Context } from 'hono';

export function handleError(err: Error, c: Context) {
  console.error('Gateway Error:', err);
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    }
  }, 500);
}

export function handleNotFound(c: Context) {
  return c.json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Route not found' }
  }, 404);
}

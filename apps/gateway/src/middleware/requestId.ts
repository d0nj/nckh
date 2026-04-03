import type { Context, Next } from 'hono';

export async function requestId(c: Context, next: Next) {
  const requestId = crypto.randomUUID();
  c.res.headers.set('X-Request-ID', requestId);
  c.res.headers.set('X-Gateway-Version', '1.0.0');
  await next();
}

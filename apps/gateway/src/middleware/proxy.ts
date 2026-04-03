import type { Context } from 'hono';
import { getRequestId } from './request-id';
import { fetchWithRetry } from '../utils/retry';

export function createProxyHandler(targetUrl: string, timeout: number) {
  return async (c: Context) => {
    const originalPath = c.req.path;
    const path = originalPath.replace(/^\/api\/\w+/, '');
    const url = `${targetUrl}${path}${c.req.query() ? '?' + new URLSearchParams(c.req.query()).toString() : ''}`;

    const requestId = getRequestId(c);
    const startTime = Date.now();

    const headers = new Headers();
    c.req.raw.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });

    headers.set('X-User-ID', c.get('userId') || '');
    headers.set('X-User-Role', c.get('userRole') || '');
    headers.set('X-Request-ID', requestId);
    headers.set('X-Gateway-Version', '1.0.0');

    try {
      console.log(`[${requestId}] Proxying ${c.req.method} ${originalPath} -> ${targetUrl}`);

      const response = await fetchWithRetry(url, {
        method: c.req.method,
        headers,
        body: ['GET', 'HEAD'].includes(c.req.method) ? undefined : await c.req.blob(),
        timeout,
        retries: 2,
      });

      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ${c.req.method} ${originalPath} completed in ${duration}ms`);

      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      c.res.headers.forEach((value, key) => {
        newResponse.headers.set(key, value);
      });

      return newResponse;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[${requestId}] Proxy error to ${targetUrl} after ${duration}ms:`, error);

      return c.json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Backend service unavailable. Please try again later.',
          requestId,
        }
      }, 503);
    }
  };
}

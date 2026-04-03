import type { Context } from 'hono';
import type { ServiceConfig } from '../types/index.js';

export function createProxyHandler(targetUrl: string) {
  return async (c: Context) => {
    const originalPath = c.req.path;
    const path = originalPath.replace(/^\/api\/\w+/, '');
    const queryString = c.req.query() 
      ? '?' + new URLSearchParams(c.req.query()).toString() 
      : '';
    const url = `${targetUrl}${path}${queryString}`;
    
    // Prepare headers
    const headers = new Headers();
    c.req.raw.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers.set(key, value);
      }
    });
    
    // Add user context headers
    headers.set('X-User-ID', c.get('userId') || '');
    headers.set('X-User-Role', c.get('userRole') || '');
    headers.set('X-Request-ID', c.res.headers.get('X-Request-ID') || '');
    
    try {
      const response = await fetch(url, {
        method: c.req.method,
        headers,
        body: ['GET', 'HEAD'].includes(c.req.method) ? undefined : await c.req.blob(),
      });
      
      // Create new response with gateway headers preserved
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
      
      // Copy gateway headers
      c.res.headers.forEach((value, key) => {
        newResponse.headers.set(key, value);
      });
      
      return newResponse;
    } catch (error) {
      console.error(`Proxy error to ${targetUrl}:`, error);
      return c.json({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Backend service unavailable' }
      }, 503);
    }
  };
}

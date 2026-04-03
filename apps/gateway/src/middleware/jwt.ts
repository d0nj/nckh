import type { Context, Next } from 'hono';
import { jwtVerify, importJWK } from 'jose';

export interface JwtAuthConfig {
  jwksUrl: string;
}

// JWKS cache
let jwksCache: { keys: any[]; timestamp: number } | null = null;
const JWKS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchJWKS(jwksUrl: string) {
  if (jwksCache && Date.now() - jwksCache.timestamp < JWKS_CACHE_TTL) {
    return jwksCache.keys;
  }

  try {
    const response = await fetch(jwksUrl, { timeout: 5000 } as any);
    const jwks = await response.json();
    jwksCache = { keys: jwks.keys, timestamp: Date.now() };
    return jwks.keys;
  } catch (error) {
    console.error('Failed to fetch JWKS:', error);
    if (jwksCache) {
      console.warn('Using stale JWKS cache as fallback');
      return jwksCache.keys;
    }
    throw error;
  }
}

async function getSigningKey(kid: string, jwksUrl: string) {
  const keys = await fetchJWKS(jwksUrl);
  const key = keys.find((k: any) => k.kid === kid);
  if (!key) {
    throw new Error(`Key not found: ${kid}`);
  }
  return await importJWK(key, 'EdDSA');
}

export function createJwtAuth(config: JwtAuthConfig) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' }
      }, 401);
    }

    const token = authHeader.slice(7);

    try {
      const tokenParts = token.split('.');
      const header = JSON.parse(Buffer.from(tokenParts[0], 'base64url').toString());
      const kid = header.kid;

      if (!kid) {
        return c.json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Token missing key ID' }
        }, 401);
      }

      const publicKey = await getSigningKey(kid, config.jwksUrl);

      const { payload } = await jwtVerify(token, publicKey, {
        algorithms: ['EdDSA'],
      });

      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return c.json({
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' }
        }, 401);
      }

      c.set('user', payload);
      c.set('userRole', payload.role as string);
      c.set('userId', payload.id as string);

      await next();
    } catch (error) {
      console.error('JWT validation error:', error);
      return c.json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token' }
      }, 401);
    }
  };
}

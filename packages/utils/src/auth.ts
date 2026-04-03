import type { Context, Next } from 'hono';
import { jwtVerify, importJWK } from 'jose';

export interface ServiceAuthConfig {
  jwksUrl: string;
  skipPaths?: string[];
  requiredRole?: string;
}

// JWKS cache
let jwksCache: { keys: any[]; timestamp: number } | null = null;
const JWKS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch JWKS from auth service
 */
async function fetchJWKS(jwksUrl: string) {
  if (jwksCache && Date.now() - jwksCache.timestamp < JWKS_CACHE_TTL) {
    return jwksCache.keys;
  }

  try {
    const response = await fetch(jwksUrl, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.status}`);
    }

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

/**
 * Get signing key from JWKS
 */
async function getSigningKey(kid: string, jwksUrl: string) {
  const keys = await fetchJWKS(jwksUrl);
  const key = keys.find((k: any) => k.kid === kid);
  if (!key) {
    throw new Error(`Key not found: ${kid}`);
  }
  return await importJWK(key, 'EdDSA');
}

/**
 * Service authentication middleware
 * Validates JWT tokens from the gateway or other services
 */
export function createServiceAuth(config: ServiceAuthConfig) {
  return async (c: Context, next: Next) => {
    const path = c.req.path;

    // Skip auth for specified paths (e.g., health checks)
    if (config.skipPaths?.some((skipPath) => path.startsWith(skipPath))) {
      await next();
      return;
    }

    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Missing or invalid Authorization header',
          },
        },
        401
      );
    }

    const token = authHeader.slice(7);

    try {
      // Decode token header to get key ID
      const tokenParts = token.split('.');
      const header = JSON.parse(
        Buffer.from(tokenParts[0], 'base64url').toString()
      );
      const kid = header.kid;

      if (!kid) {
        return c.json(
          {
            success: false,
            error: {
              code: 'INVALID_TOKEN',
              message: 'Token missing key ID',
            },
          },
          401
        );
      }

      // Get signing key from JWKS
      const publicKey = await getSigningKey(kid, config.jwksUrl);

      // Verify token
      const { payload } = await jwtVerify(token, publicKey, {
        algorithms: ['EdDSA'],
      });

      // Check expiration
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return c.json(
          {
            success: false,
            error: {
              code: 'TOKEN_EXPIRED',
              message: 'Token has expired',
            },
          },
          401
        );
      }

      // Check required role if specified
      if (config.requiredRole) {
        const userRole = payload.role as string;
        if (!userRole || userRole !== config.requiredRole) {
          return c.json(
            {
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: 'Insufficient permissions',
              },
            },
            403
          );
        }
      }

      // Set user context
      c.set('user', payload);
      c.set('userId', payload.id as string);
      c.set('userRole', payload.role as string);
      c.set('organizationId', payload.organizationId as string | undefined);

      await next();
    } catch (error) {
      console.error('JWT validation error:', error);
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired token',
          },
        },
        401
      );
    }
  };
}

/**
 * Extract user ID from context (after auth middleware)
 */
export function getUserId(c: Context): string | undefined {
  return c.get('userId');
}

/**
 * Extract user role from context (after auth middleware)
 */
export function getUserRole(c: Context): string | undefined {
  return c.get('userRole');
}

/**
 * Extract organization ID from context (after auth middleware)
 */
export function getOrganizationId(c: Context): string | undefined {
  return c.get('organizationId');
}

/**
 * Require specific role middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const userRole = c.get('userRole');

    if (!userRole || !allowedRoles.includes(userRole)) {
      return c.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Required role: ${allowedRoles.join(' or ')}`,
          },
        },
        403
      );
    }

    await next();
  };
}

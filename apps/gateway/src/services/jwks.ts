import { importJWK } from 'jose';
import type { JWKSKey, JWKSResponse } from '../types/index.js';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// JWKS cache
interface JWKSCache {
  keys: JWKSKey[];
  timestamp: number;
}

let jwksCache: JWKSCache | null = null;
const JWKS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchJWKS(): Promise<JWKSKey[]> {
  // Return cached JWKS if valid
  if (jwksCache && Date.now() - jwksCache.timestamp < JWKS_CACHE_TTL) {
    return jwksCache.keys;
  }

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/api/auth/jwks`);
    if (!response.ok) {
      throw new Error(`Failed to fetch JWKS: ${response.status}`);
    }
    const jwks: JWKSResponse = await response.json();
    jwksCache = { keys: jwks.keys, timestamp: Date.now() };
    return jwks.keys;
  } catch (error) {
    console.error('Failed to fetch JWKS:', error);
    // Return cached keys even if expired, as fallback
    if (jwksCache) {
      return jwksCache.keys;
    }
    throw error;
  }
}

export async function getSigningKey(kid: string) {
  const keys = await fetchJWKS();
  const key = keys.find((k: JWKSKey) => k.kid === kid);
  if (!key) {
    throw new Error(`Key not found: ${kid}`);
  }
  return await importJWK(key, 'EdDSA');
}

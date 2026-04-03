import type { Context, Next } from 'hono';

export interface JWKSKey {
  crv: string;
  x: string;
  kty: string;
  kid: string;
}

export interface JWKSResponse {
  keys: JWKSKey[];
}

export interface UserContext {
  id: string;
  email: string;
  role: string;
}

export interface ServiceConfig {
  url: string;
  rateLimit: number;
}

export type RateLimitStore = Map<string, { count: number; resetAt: number }>;

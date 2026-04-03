import type { Context, Next } from 'hono';
import { jwtVerify, importJWK } from 'jose';
import { fetchJWKS, getSigningKey } from '../services/jwks.js';

export async function jwtAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ 
      success: false, 
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' }
    }, 401);
  }
  
  const token = authHeader.slice(7);
  
  try {
    // Decode token header to get key ID
    const tokenParts = token.split('.');
    const header = JSON.parse(Buffer.from(tokenParts[0], 'base64url').toString());
    const kid = header.kid;
    
    if (!kid) {
      return c.json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Token missing key ID' }
      }, 401);
    }
    
    // Get signing key from JWKS
    const publicKey = await getSigningKey(kid);
    
    // Verify token
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ['EdDSA'],
    });
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return c.json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' }
      }, 401);
    }
    
    // Set user context
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
}

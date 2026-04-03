import { config } from 'dotenv';
config();

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createRateLimitMiddleware } from './middleware/rate-limit';
import { requestIdMiddleware, getRequestId } from './middleware/request-id';
import { createJwtAuth } from './middleware/jwt';
import { createProxyHandler } from './middleware/proxy';
import { createHealthCheck } from './routes/health';
import { errorHandler } from './middleware/error';

// Configuration
const PORT = process.env.PORT || 8000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '30000');

// Service configuration with rate limits
const SERVICES = {
  admin: {
    url: process.env.ADMIN_BFF_URL || 'http://localhost:3001',
    rateLimit: parseInt(process.env.ADMIN_RATE_LIMIT || '200'),
  },
  teacher: {
    url: process.env.TEACHER_BFF_URL || 'http://localhost:3002',
    rateLimit: parseInt(process.env.TEACHER_RATE_LIMIT || '300'),
  },
  student: {
    url: process.env.STUDENT_BFF_URL || 'http://localhost:3003',
    rateLimit: parseInt(process.env.STUDENT_RATE_LIMIT || '500'),
  },
};

// Create Hono app
const app = new Hono();

// Create JWT auth middleware
const jwtAuth = createJwtAuth({
  jwksUrl: `${AUTH_SERVICE_URL}/api/auth/jwks`,
});

// Global middleware - ORDER MATTERS
app.use('*', logger());
app.use('*', requestIdMiddleware);
app.use('*', cors({
  origin: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  credentials: true,
  allowHeaders: ['Authorization', 'Content-Type', 'X-Request-ID'],
  exposeHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));

// Health check endpoint
app.get('/health', createHealthCheck(SERVICES));

// Admin routes with rate limiting
app.use('/api/admin/*',
  jwtAuth,
  createRateLimitMiddleware({
    windowMs: 60 * 1000,
    maxRequests: SERVICES.admin.rateLimit,
    keyGenerator: (c) => `admin:${c.get('userRole') || 'anonymous'}`,
  })
);
app.all('/api/admin/*', createProxyHandler(SERVICES.admin.url, REQUEST_TIMEOUT));

// Teacher routes with rate limiting
app.use('/api/teacher/*',
  jwtAuth,
  createRateLimitMiddleware({
    windowMs: 60 * 1000,
    maxRequests: SERVICES.teacher.rateLimit,
    keyGenerator: (c) => `teacher:${c.get('userRole') || 'anonymous'}`,
  })
);
app.all('/api/teacher/*', createProxyHandler(SERVICES.teacher.url, REQUEST_TIMEOUT));

// Student routes with rate limiting
app.use('/api/student/*',
  jwtAuth,
  createRateLimitMiddleware({
    windowMs: 60 * 1000,
    maxRequests: SERVICES.student.rateLimit,
    keyGenerator: (c) => `student:${c.get('userRole') || 'anonymous'}`,
  })
);
app.all('/api/student/*', createProxyHandler(SERVICES.student.url, REQUEST_TIMEOUT));

// Error handler
app.onError(errorHandler);

// Not found handler
app.notFound((c) => {
  const requestId = getRequestId(c);
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
      requestId,
    },
  }, 404);
});

// Start server
console.log('Thai Binh University API Gateway');
console.log('=====================================\n');
console.log(`Port: ${PORT}`);
console.log(`JWKS Endpoint: ${AUTH_SERVICE_URL}/api/auth/jwks`);
console.log(`Request Timeout: ${REQUEST_TIMEOUT}ms`);
console.log('\nRoutes:');
console.log(`  /api/admin/*   -> ${SERVICES.admin.url}   (Rate: ${SERVICES.admin.rateLimit}/min)`);
console.log(`  /api/teacher/* -> ${SERVICES.teacher.url} (Rate: ${SERVICES.teacher.rateLimit}/min)`);
console.log(`  /api/student/* -> ${SERVICES.student.url} (Rate: ${SERVICES.student.rateLimit}/min)`);
console.log('\nFeatures:');
console.log('  ✅ JWT Authentication with JWKS');
console.log('  ✅ Redis-based distributed rate limiting');
console.log('  ✅ Request ID propagation');
console.log('  ✅ Retry with exponential backoff');
console.log('  ✅ Aggregated health checks');
console.log('  ✅ Request timeouts');
console.log('\nGateway ready!\n');

export default {
  port: PORT,
  fetch: app.fetch,
};

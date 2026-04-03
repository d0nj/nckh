import { config } from 'dotenv';
config();

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { createDatabase, getPoolStats, closeAllConnections } from '@thai-binh/database/pg';
import { createServiceAuth } from '@thai-binh/utils/auth';
import { blankRoutes } from './routes/blanks';
import { registryRoutes } from './routes/registry';
import { certificateRoutes } from './routes/certificates';
import { workflowRoutes } from './routes/workflow';

const app = new Hono();

// Service authentication middleware
const authMiddleware = createServiceAuth({
  jwksUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:8000/api/auth/jwks',
  skipPaths: ['/health'],
});

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));

// Apply auth middleware to all routes except health
app.use('*', authMiddleware);

// Database with connection pooling
const db = createDatabase({
  url: process.env.DATABASE_URL || 'postgresql://thai_binh:thai_binh_dev@localhost:5432/thai_binh_training',
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
  minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '5'),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
});

// Health check with pool stats
app.get('/health', (c) => {
  const poolStats = getPoolStats();
  return c.json({
    status: 'healthy',
    service: 'certification-service',
    timestamp: new Date().toISOString(),
    database: {
      pools: poolStats.length,
      stats: poolStats,
    },
  });
});

// Routes
app.route('/api/blanks', blankRoutes);
app.route('/api/registry', registryRoutes);
app.route('/api/certificates', certificateRoutes);
app.route('/api/workflow', workflowRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Certification Service Error:', err);
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  }, 500);
});

const port = parseInt(process.env.PORT || '3007');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Certification Service] SIGTERM received, shutting down gracefully...');
  await closeAllConnections();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Certification Service] SIGINT received, shutting down gracefully...');
  await closeAllConnections();
  process.exit(0);
});

console.log(`🎓 Certification Service starting on port ${port}...`);
console.log(`📜 Quản lý Văn bằng Chứng chỉ - Thông tư 21/2019/TT-BGDĐT`);
console.log(`📊 Connection pooling: max=${process.env.DB_MAX_CONNECTIONS || 20}, min=${process.env.DB_MIN_CONNECTIONS || 5}`);

export default {
  port,
  fetch: app.fetch,
};

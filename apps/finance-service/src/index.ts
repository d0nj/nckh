import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { eq } from 'drizzle-orm';
import { createDatabase, schema, getPoolStats, closeAllConnections } from '@thai-binh/database/pg';
import { createServiceAuth } from '@thai-binh/utils/auth';
import { paymentRoutes } from './routes/payments';
import { validateVNPayConfig } from './config/vnpay';

const app = new Hono();

// Validate VNPay configuration on startup
validateVNPayConfig();

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
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
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
    service: 'finance-service',
    timestamp: new Date().toISOString(),
    database: {
      pools: poolStats.length,
      stats: poolStats,
    },
  });
});

// Get fee schedules
app.get('/api/fees', async (c) => {
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const fees = await db.query.feeSchedules.findMany({
    where: (fees, { eq, and }) => and(
      eq(fees.organizationId, organizationId),
      eq(fees.isActive, true)
    ),
  });
  
  return c.json({ fees });
});

// Create invoice
app.post('/api/invoices', async (c) => {
  const body = await c.req.json();
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const [invoice] = await db.insert(schema.invoices).values({
    organizationId,
    ...body,
    status: 'pending',
  }).returning();
  
  return c.json({ invoice }, 201);
});

// Process payment
app.post('/api/payments', async (c) => {
  const body = await c.req.json();
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const [payment] = await db.insert(schema.payments).values({
    organizationId,
    ...body,
    status: 'completed',
    paidAt: new Date(),
  }).returning();

  // Update invoice status
  if (body.invoiceId) {
    await db.update(schema.invoices)
      .set({ status: 'paid', paidAmount: body.amount })
      .where(eq(schema.invoices.id, body.invoiceId));
  }
  
  return c.json({ payment }, 201);
});

// Payment routes (VNPay integration)
app.route('/api/payments', paymentRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Finance Service Error:', err);
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  }, 500);
});

const port = parseInt(process.env.PORT || '3008');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Finance Service] SIGTERM received, shutting down gracefully...');
  await closeAllConnections();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Finance Service] SIGINT received, shutting down gracefully...');
  await closeAllConnections();
  process.exit(0);
});

console.log(`💰 Finance Service starting on port ${port}...`);
console.log(`💳 VNPay integration enabled`);
console.log(`📊 Connection pooling: max=${process.env.DB_MAX_CONNECTIONS || 20}, min=${process.env.DB_MIN_CONNECTIONS || 5}`);

export default {
  port,
  fetch: app.fetch,
};

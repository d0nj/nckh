import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Redis connection
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Queues
const enrollmentQueue = new Queue('enrollment', { connection: redis });
const certificateQueue = new Queue('certificate', { connection: redis });
const notificationQueue = new Queue('notification', { connection: redis });

// Workers
const enrollmentWorker = new Worker('enrollment', async (job) => {
  console.log('Processing enrollment:', job.data);
  // Send enrollment confirmation email
  return { success: true };
}, { connection: redis });

const certificateWorker = new Worker('certificate', async (job) => {
  console.log('Processing certificate:', job.data);
  // Send certificate ready notification
  return { success: true };
}, { connection: redis });

const notificationWorker = new Worker('notification', async (job) => {
  console.log('Processing notification:', job.data);
  // Send email/SMS notification
  return { success: true };
}, { connection: redis });

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
  });
});

// Add job to queue
app.post('/api/notify', async (c) => {
  const body = await c.req.json();
  
  const job = await notificationQueue.add(body.type, body.data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  });
  
  return c.json({ jobId: job.id }, 201);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

const port = parseInt(process.env.PORT || '3009');

console.log(`🔔 Notification Service starting on port ${port}...`);
console.log(`📧 BullMQ workers initialized`);

export default {
  port,
  fetch: app.fetch,
};

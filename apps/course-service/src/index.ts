import { config } from 'dotenv';
config();

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { validateEnv } from '@thai-binh/config/env';
import { createDatabase } from '@thai-binh/database';
import { createServiceAuth } from '@thai-binh/utils/auth';
import { courseRoutes } from './routes/courses';
import { moduleRoutes } from './routes/modules';
import { lessonRoutes } from './routes/lessons';
import { healthRoutes } from './routes/health';

const env = validateEnv();
const db = createDatabase({
  url: env.DATABASE_URL,
});

const app = new Hono();

// Service authentication middleware
const authMiddleware = createServiceAuth({
  jwksUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:8000/api/auth/jwks',
  skipPaths: ['/health'],
});

app.use('*', logger());
app.use('*', cors({ 
  origin: env.CORS_ORIGINS.split(','), 
  credentials: true 
}));

// Apply auth middleware to all routes except health
app.use('*', authMiddleware);

app.route('/health', healthRoutes);
app.route('/courses', courseRoutes(db));
app.route('/modules', moduleRoutes(db));
app.route('/lessons', lessonRoutes(db));

app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ 
    success: false, 
    error: { code: 'INTERNAL_ERROR', message: err.message } 
  }, 500);
});

const port = env.PORT || 3005;

export default {
  port,
  fetch: app.fetch,
};

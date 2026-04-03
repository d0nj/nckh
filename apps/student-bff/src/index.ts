import { config } from 'dotenv';
config();

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { validateBffEnv } from '@thai-binh/config/env';
import { createServiceClients } from './services/client';
import { courseRoutes } from './routes/courses';
import { dashboardRoutes } from './routes/dashboard';
import { submissionRoutes } from './routes/submissions';
import { healthRoutes } from './routes/health';

const env = validateBffEnv();
const services = createServiceClients();

const app = new Hono();

app.use('*', logger());
app.use('*', cors({ 
  origin: env.CORS_ORIGINS.split(','), 
  credentials: true 
}));

app.route('/health', healthRoutes);
app.route('/courses', courseRoutes(services));
app.route('/dashboard', dashboardRoutes(services));
app.route('/submissions', submissionRoutes(services));

app.onError((err, c) => {
  console.error('Student BFF Error:', err);
  return c.json({ 
    success: false, 
    error: { code: 'INTERNAL_ERROR', message: err.message } 
  }, 500);
});

const port = env.PORT || 3003;

export default {
  port,
  fetch: app.fetch,
};

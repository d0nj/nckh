import { config } from 'dotenv';
config();

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { validateBffEnv } from '@thai-binh/config/env';
import { createServiceClients } from './services/client';
import { dashboardRoutes } from './routes/dashboard';
import { userManagementRoutes } from './routes/users';
import { analyticsRoutes } from './routes/analytics';
import { healthRoutes } from './routes/health';

const env = validateBffEnv();
const services = createServiceClients();

const app = new Hono();

app.use('*', logger());
app.use('*', cors({ 
  origin: env.CORS_ORIGINS.split(','), 
  credentials: true 
}));

// Health check
app.route('/health', healthRoutes);

// Admin routes
app.route('/dashboard', dashboardRoutes(services));
app.route('/users', userManagementRoutes(services));
app.route('/analytics', analyticsRoutes(services));

app.onError((err, c) => {
  console.error('Admin BFF Error:', err);
  return c.json({ 
    success: false, 
    error: { code: 'INTERNAL_ERROR', message: err.message } 
  }, 500);
});

const port = env.PORT || 3001;

export default {
  port,
  fetch: app.fetch,
};

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { validateBffEnv } from '@thai-binh/config/env';
import { createServiceClients } from './services/client';
import { dashboardRoutes } from './routes/dashboard';
import { userManagementRoutes } from './routes/users';
import { analyticsRoutes } from './routes/analytics';
import { healthRoutes } from './routes/health';

console.log('[AdminBFF] Starting up...');
console.log('[AdminBFF] Validating environment...');
const env = validateBffEnv();
console.log('[AdminBFF] Environment validated, PORT:', env.PORT);

console.log('[AdminBFF] Creating service clients...');
const services = createServiceClients();
console.log('[AdminBFF] Service clients created');

console.log('[AdminBFF] Creating Hono app...');
const app = new Hono();
console.log('[AdminBFF] Hono app created');

console.log('[AdminBFF] Adding middleware...');
app.use('*', logger());
app.use('*', cors({ 
  origin: env.CORS_ORIGINS.split(','), 
  credentials: true 
}));
console.log('[AdminBFF] Middleware added');

console.log('[AdminBFF] Adding routes...');
// Health check
app.route('/health', healthRoutes);
console.log('[AdminBFF] Health routes added');

// Admin routes
app.route('/dashboard', dashboardRoutes(services));
console.log('[AdminBFF] Dashboard routes added');
app.route('/users', userManagementRoutes(services));
console.log('[AdminBFF] User routes added');
app.route('/analytics', analyticsRoutes(services));
console.log('[AdminBFF] Analytics routes added');

app.onError((err, c) => {
  console.error('Admin BFF Error:', err);
  return c.json({ 
    success: false, 
    error: { code: 'INTERNAL_ERROR', message: err.message } 
  }, 500);
});

const port = env.PORT || 3001;
console.log('[AdminBFF] Configuring export with port:', port);

export default {
  port,
  fetch: app.fetch,
};
console.log('[AdminBFF] Export complete - server should start now');

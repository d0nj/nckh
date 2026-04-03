import { Hono } from 'hono';
import { successResponse, errorResponse } from '@thai-binh/utils';
import type { ServiceClients } from '../services/client';

export function userManagementRoutes(services: ServiceClients) {
  const app = new Hono();

  // List all users
  app.get('/', async (c) => {
    const { page = '1', pageSize = '10', role } = c.req.query();
    const queryParams = new URLSearchParams({ page, pageSize });
    if (role) queryParams.append('role', role);
    
    const users = await services.user.get(`/users?${queryParams.toString()}`);
    return successResponse(c, users);
  });

  // Get user details with enrollments
  app.get('/:id', async (c) => {
    const { id } = c.req.param();
    
    const [user, enrollments] = await Promise.all([
      services.user.get(`/users/${id}`),
      services.enrollment.get(`/enrollments/user/${id}`),
    ]);

    return successResponse(c, { ...user, enrollments });
  });

  // Create user
  app.post('/', async (c) => {
    const body = await c.req.json();
    const user = await services.user.post('/users', body);
    return successResponse(c, user, 201);
  });

  // Update user
  app.put('/:id', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();
    const user = await services.user.put(`/users/${id}`, body);
    return successResponse(c, user);
  });

  // Delete user
  app.delete('/:id', async (c) => {
    const { id } = c.req.param();
    await services.user.del(`/users/${id}`);
    return successResponse(c, { id, deleted: true });
  });

  return app;
}

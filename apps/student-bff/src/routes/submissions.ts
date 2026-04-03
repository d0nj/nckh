import { Hono } from 'hono';
import { successResponse, errorResponse } from '@thai-binh/utils';
import type { ServiceClients } from '../services/client';

export function submissionRoutes(services: ServiceClients) {
  const app = new Hono();

  // Get my submissions
  app.get('/', async (c) => {
    const userId = c.req.header('X-User-ID');
    if (!userId) {
      return errorResponse(c, 'UNAUTHORIZED', 'User ID required', 401);
    }

    // This would need a specific endpoint in enrollment service
    return successResponse(c, { submissions: [] });
  });

  // Submit assignment
  app.post('/assignment/:assignmentId', async (c) => {
    const { assignmentId } = c.req.param();
    const userId = c.req.header('X-User-ID');
    const body = await c.req.json();

    if (!userId) {
      return errorResponse(c, 'UNAUTHORIZED', 'User ID required', 401);
    }

    const submission = await services.enrollment.post(
      `/assignments/${assignmentId}/submit`,
      {
        ...body,
        userId,
      }
    );

    return successResponse(c, submission, 201);
  });

  return app;
}

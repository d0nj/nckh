import { Hono } from 'hono';
import { successResponse, errorResponse } from '@thai-binh/utils';
import type { ServiceClients } from '../services/client';

export function courseRoutes(services: ServiceClients) {
  const app = new Hono();

  // Get my courses (as teacher)
  app.get('/my-courses', async (c) => {
    const userId = c.req.header('X-User-ID');
    if (!userId) {
      return errorResponse(c, 'UNAUTHORIZED', 'User ID required', 401);
    }

    const courses = await services.course.get(`/courses?teacherId=${userId}`);
    return successResponse(c, courses);
  });

  // Create new course
  app.post('/', async (c) => {
    const userId = c.req.header('X-User-ID');
    if (!userId) {
      return errorResponse(c, 'UNAUTHORIZED', 'User ID required', 401);
    }

    const body = await c.req.json();
    const course = await services.course.post('/courses', {
      ...body,
      teacherId: userId,
      status: 'draft',
    });

    return successResponse(c, course, 201);
  });

  // Update course
  app.put('/:id', async (c) => {
    const { id } = c.req.param();
    const userId = c.req.header('X-User-ID');
    const body = await c.req.json();

    // Verify ownership first (simplified)
    const course = await services.course.get(`/courses/${id}`);
    if (course.teacherId !== userId) {
      return errorResponse(c, 'FORBIDDEN', 'Not your course', 403);
    }

    const updated = await services.course.put(`/courses/${id}`, body);
    return successResponse(c, updated);
  });

  // Get course with full details
  app.get('/:id', async (c) => {
    const { id } = c.req.param();
    const [course, enrollments] = await Promise.all([
      services.course.get(`/courses/${id}`),
      services.enrollment.get(`/enrollments/course/${id}`),
    ]);

    return successResponse(c, { ...course, enrollments });
  });

  return app;
}

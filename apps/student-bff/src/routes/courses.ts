import { Hono } from 'hono';
import { successResponse, errorResponse } from '@thai-binh/utils';
import type { ServiceClients } from '../services/client';

export function courseRoutes(services: ServiceClients) {
  const app = new Hono();

  // Get available courses
  app.get('/available', async (c) => {
    const { page = '1', pageSize = '10' } = c.req.query();
    const courses = await services.course.get(
      `/courses?status=published&page=${page}&pageSize=${pageSize}`
    );
    return successResponse(c, courses);
  });

  // Get enrolled courses
  app.get('/enrolled', async (c) => {
    const userId = c.req.header('X-User-ID');
    if (!userId) {
      return errorResponse(c, 'UNAUTHORIZED', 'User ID required', 401);
    }

    const enrollments = await services.enrollment.get(`/enrollments/user/${userId}`);
    return successResponse(c, enrollments);
  });

  // Enroll in a course
  app.post('/:courseId/enroll', async (c) => {
    const { courseId } = c.req.param();
    const userId = c.req.header('X-User-ID');
    
    if (!userId) {
      return errorResponse(c, 'UNAUTHORIZED', 'User ID required', 401);
    }

    const enrollment = await services.enrollment.post('/enrollments', {
      userId,
      courseId,
    });

    return successResponse(c, enrollment, 201);
  });

  // Get course details with progress
  app.get('/:id', async (c) => {
    const { id } = c.req.param();
    const userId = c.req.header('X-User-ID');

    const [course, progress] = await Promise.all([
      services.course.get(`/courses/${id}`),
      services.enrollment.get(`/progress/user/${userId}/course/${id}`),
    ]);

    return successResponse(c, { ...course, progress });
  });

  // Mark lesson as complete
  app.post('/lessons/:lessonId/complete', async (c) => {
    const { lessonId } = c.req.param();
    const userId = c.req.header('X-User-ID');

    const completed = await services.enrollment.post('/progress/complete', {
      lessonId,
      userId,
    });

    return successResponse(c, completed, 201);
  });

  return app;
}

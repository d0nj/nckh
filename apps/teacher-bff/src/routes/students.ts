import { Hono } from 'hono';
import { successResponse } from '@thai-binh/utils';
import type { ServiceClients } from '../services/client';

export function studentRoutes(services: ServiceClients) {
  const app = new Hono();

  // Get students enrolled in teacher's courses
  app.get('/my-students', async (c) => {
    const userId = c.req.header('X-User-ID');
    // Get all courses by teacher, then get enrollments
    const courses = await services.course.get(`/courses?teacherId=${userId}`);
    return successResponse(c, { courses: courses.items || [] });
  });

  // Get student progress in a course
  app.get('/:studentId/course/:courseId/progress', async (c) => {
    const { studentId, courseId } = c.req.param();
    const progress = await services.enrollment.get(`/progress/user/${studentId}/course/${courseId}`);
    return successResponse(c, progress);
  });

  return app;
}

import { Hono } from 'hono';
import { successResponse, errorResponse } from '@thai-binh/utils';
import type { ServiceClients } from '../services/client';

export function dashboardRoutes(services: ServiceClients) {
  const app = new Hono();

  app.get('/', async (c) => {
    const userId = c.req.header('X-User-ID');
    if (!userId) {
      return errorResponse(c, 'UNAUTHORIZED', 'User ID required', 401);
    }

    try {
      const [profile, enrollments] = await Promise.all([
        services.user.get(`/profiles/${userId}`),
        services.enrollment.get(`/enrollments/user/${userId}`),
      ]);

      // Get course details for each enrollment
      const coursePromises = enrollments.items?.map(async (enrollment: any) => {
        const course = await services.course.get(`/courses/${enrollment.courseId}`);
        const progress = await services.enrollment.get(`/progress/enrollment/${enrollment.id}`);
        return {
          ...enrollment,
          course,
          progress,
        };
      }) || [];

      const enrolledCourses = await Promise.all(coursePromises);

      return successResponse(c, {
        profile,
        enrolledCourses,
        totalEnrolled: enrolledCourses.length,
        inProgress: enrolledCourses.filter((e: any) => e.status === 'active').length,
        completed: enrolledCourses.filter((e: any) => e.status === 'completed').length,
      });
    } catch (error) {
      return errorResponse(c, 'SERVICE_ERROR', 'Failed to load dashboard', 503);
    }
  });

  return app;
}

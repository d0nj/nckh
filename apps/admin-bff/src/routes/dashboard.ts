import { Hono } from 'hono';
import { successResponse } from '@thai-binh/utils';
import type { ServiceClients } from '../services/client';

export function dashboardRoutes(services: ServiceClients) {
  const app = new Hono();

  app.get('/stats', async (c) => {
    try {
      const [users, courses, enrollments] = await Promise.all([
        services.user.get('/users?page=1&pageSize=1'),
        services.course.get('/courses?page=1&pageSize=1'),
        services.enrollment.get('/enrollments?page=1&pageSize=1'),
      ]);

      // Calculate active enrollments (this is simplified)
      const activeEnrollments = enrollments.items?.filter((e: any) => e.status === 'active').length || 0;

      return successResponse(c, {
        totalUsers: users.total || 0,
        totalCourses: courses.total || 0,
        totalEnrollments: enrollments.total || 0,
        activeEnrollments,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return successResponse(c, {
        totalUsers: 0,
        totalCourses: 0,
        totalEnrollments: 0,
        activeEnrollments: 0,
        error: 'Some services are unavailable',
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.get('/recent-activity', async (c) => {
    // Aggregate recent activity from all services
    return successResponse(c, {
      recentEnrollments: [],
      recentCompletions: [],
      recentSubmissions: [],
    });
  });

  return app;
}

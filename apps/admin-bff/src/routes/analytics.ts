import { Hono } from 'hono';
import { successResponse } from '@thai-binh/utils';
import type { ServiceClients } from '../services/client';

export function analyticsRoutes(services: ServiceClients) {
  const app = new Hono();

  app.get('/enrollment-trends', async (c) => {
    // Get enrollment data and calculate trends
    return successResponse(c, {
      daily: [],
      weekly: [],
      monthly: [],
    });
  });

  app.get('/course-popularity', async (c) => {
    // Get popular courses by enrollment count
    return successResponse(c, {
      topCourses: [],
    });
  });

  app.get('/teacher-performance', async (c) => {
    // Get teacher performance metrics
    return successResponse(c, {
      teachers: [],
    });
  });

  return app;
}

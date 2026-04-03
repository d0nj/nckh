import { Hono } from 'hono';
import { successResponse } from '@thai-binh/utils';
import type { ServiceClients } from '../services/client';

export function assignmentRoutes(services: ServiceClients) {
  const app = new Hono();

  // Get assignments for a course
  app.get('/course/:courseId', async (c) => {
    const { courseId } = c.req.param();
    const assignments = await services.enrollment.get(`/assignments/course/${courseId}`);
    return successResponse(c, assignments);
  });

  // Create assignment
  app.post('/', async (c) => {
    const body = await c.req.json();
    const assignment = await services.enrollment.post('/assignments', body);
    return successResponse(c, assignment, 201);
  });

  // Get submissions for an assignment
  app.get('/:assignmentId/submissions', async (c) => {
    const { assignmentId } = c.req.param();
    const submissions = await services.enrollment.get(`/assignments/${assignmentId}/submissions`);
    return successResponse(c, submissions);
  });

  // Grade a submission
  app.patch('/submissions/:submissionId/grade', async (c) => {
    const { submissionId } = c.req.param();
    const body = await c.req.json();
    const submission = await services.enrollment.patch(
      `/assignments/submissions/${submissionId}/grade`,
      body
    );
    return successResponse(c, submission);
  });

  return app;
}

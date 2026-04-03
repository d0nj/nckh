import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { assignments, submissions } from '@thai-binh/database';
import { successResponse, errorResponse } from '@thai-binh/utils';
import type { Database } from '@thai-binh/database';

export function assignmentRoutes(db: Database) {
  const app = new Hono();

  // Get assignments by course
  app.get('/course/:courseId', async (c) => {
    const { courseId } = c.req.param();
    const courseAssignments = await db.select().from(assignments).where(eq(assignments.courseId, courseId));
    return successResponse(c, courseAssignments);
  });

  // Get assignment
  app.get('/:id', async (c) => {
    const { id } = c.req.param();
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    
    if (!assignment) {
      return errorResponse(c, 'NOT_FOUND', 'Assignment not found', 404);
    }

    return successResponse(c, assignment);
  });

  // Create assignment
  app.post('/', async (c) => {
    const body = await c.req.json();
    
    const [assignment] = await db.insert(assignments).values({
      ...body,
      createdAt: new Date(),
    }).returning();

    return successResponse(c, assignment, 201);
  });

  // Get submissions by assignment
  app.get('/:assignmentId/submissions', async (c) => {
    const { assignmentId } = c.req.param();
    const assignmentSubmissions = await db.select().from(submissions).where(eq(submissions.assignmentId, assignmentId));
    return successResponse(c, assignmentSubmissions);
  });

  // Submit assignment
  app.post('/:assignmentId/submit', async (c) => {
    const { assignmentId } = c.req.param();
    const body = await c.req.json();
    
    const [submission] = await db.insert(submissions).values({
      ...body,
      assignmentId,
      status: 'submitted',
      submittedAt: new Date(),
    }).returning();

    return successResponse(c, submission, 201);
  });

  // Grade submission
  app.patch('/submissions/:submissionId/grade', async (c) => {
    const { submissionId } = c.req.param();
    const { score, feedback } = await c.req.json();

    const [updated] = await db.update(submissions)
      .set({ 
        score, 
        feedback, 
        status: 'graded',
        gradedAt: new Date(),
      })
      .where(eq(submissions.id, submissionId))
      .returning();

    if (!updated) {
      return errorResponse(c, 'NOT_FOUND', 'Submission not found', 404);
    }

    return successResponse(c, updated);
  });

  return app;
}

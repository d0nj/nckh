import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { progress } from '@thai-binh/database';
import { successResponse, errorResponse } from '@thai-binh/utils';
import type { Database } from '@thai-binh/database';

export function progressRoutes(db: Database) {
  const app = new Hono();

  // Get progress by enrollment
  app.get('/enrollment/:enrollmentId', async (c) => {
    const { enrollmentId } = c.req.param();
    const progressRecords = await db.select().from(progress).where(eq(progress.enrollmentId, enrollmentId));
    return successResponse(c, progressRecords);
  });

  // Get progress by user and course
  app.get('/user/:userId/course/:courseId', async (c) => {
    const { userId, courseId } = c.req.param();
    // This would need a join with enrollments table in a real implementation
    return successResponse(c, { userId, courseId, message: 'Progress endpoint' });
  });

  // Mark lesson as complete
  app.post('/complete', async (c) => {
    const body = await c.req.json();
    
    const [record] = await db.insert(progress).values({
      ...body,
      completed: true,
      completedAt: new Date(),
    }).returning();

    return successResponse(c, record, 201);
  });

  // Update progress
  app.put('/:id', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();

    const [updated] = await db.update(progress)
      .set(body)
      .where(eq(progress.id, id))
      .returning();

    if (!updated) {
      return errorResponse(c, 'NOT_FOUND', 'Progress record not found', 404);
    }

    return successResponse(c, updated);
  });

  return app;
}

import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { enrollments, grades } from '@thai-binh/database';
import { successResponse, errorResponse } from '@thai-binh/utils';
import type { Database } from '@thai-binh/database';

export function enrollmentRoutes(db: Database) {
  const app = new Hono();

  // Get enrollments by user
  app.get('/user/:userId', async (c) => {
    const { userId } = c.req.param();
    const userEnrollments = await db.select().from(enrollments).where(eq(enrollments.userId, userId));
    return successResponse(c, userEnrollments);
  });

  // Get enrollments by course
  app.get('/course/:courseId', async (c) => {
    const { courseId } = c.req.param();
    const courseEnrollments = await db.select().from(enrollments).where(eq(enrollments.courseId, courseId));
    return successResponse(c, courseEnrollments);
  });

  // Get specific enrollment
  app.get('/:id', async (c) => {
    const { id } = c.req.param();
    const [enrollment] = await db.select().from(enrollments).where(eq(enrollments.id, id));
    
    if (!enrollment) {
      return errorResponse(c, 'NOT_FOUND', 'Enrollment not found', 404);
    }

    return successResponse(c, enrollment);
  });

  // Create enrollment
  app.post('/', async (c) => {
    const body = await c.req.json();
    
    const [enrollment] = await db.insert(enrollments).values({
      ...body,
      status: 'active',
      enrolledAt: new Date(),
    }).returning();

    return successResponse(c, enrollment, 201);
  });

  // Update enrollment status
  app.patch('/:id/status', async (c) => {
    const { id } = c.req.param();
    const { status } = await c.req.json();

    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const [updated] = await db.update(enrollments)
      .set(updateData)
      .where(eq(enrollments.id, id))
      .returning();

    if (!updated) {
      return errorResponse(c, 'NOT_FOUND', 'Enrollment not found', 404);
    }

    return successResponse(c, updated);
  });

  // Drop enrollment
  app.delete('/:id', async (c) => {
    const { id } = c.req.param();
    
    const [updated] = await db.update(enrollments)
      .set({ status: 'dropped' })
      .where(eq(enrollments.id, id))
      .returning();

    if (!updated) {
      return errorResponse(c, 'NOT_FOUND', 'Enrollment not found', 404);
    }

    return successResponse(c, { id: updated.id, status: 'dropped' });
  });

  return app;
}

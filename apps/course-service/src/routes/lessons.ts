import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { lessons } from '@thai-binh/database';
import { successResponse, errorResponse } from '@thai-binh/utils';
import type { Database } from '@thai-binh/database';

export function lessonRoutes(db: Database) {
  const app = new Hono();

  // Get lessons by module
  app.get('/', async (c) => {
    const { moduleId } = c.req.query();
    if (!moduleId) {
      return errorResponse(c, 'VALIDATION_ERROR', 'moduleId is required', 400);
    }

    const moduleLessons = await db.select().from(lessons).where(eq(lessons.moduleId, moduleId));
    return successResponse(c, moduleLessons);
  });

  // Get lesson
  app.get('/:id', async (c) => {
    const { id } = c.req.param();
    
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    if (!lesson) {
      return errorResponse(c, 'NOT_FOUND', 'Lesson not found', 404);
    }

    return successResponse(c, lesson);
  });

  // Create lesson
  app.post('/', async (c) => {
    const body = await c.req.json();
    
    const [lesson] = await db.insert(lessons).values({
      ...body,
      createdAt: new Date(),
    }).returning();

    return successResponse(c, lesson, 201);
  });

  // Update lesson
  app.put('/:id', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();

    const [updated] = await db.update(lessons)
      .set(body)
      .where(eq(lessons.id, id))
      .returning();

    if (!updated) {
      return errorResponse(c, 'NOT_FOUND', 'Lesson not found', 404);
    }

    return successResponse(c, updated);
  });

  // Delete lesson
  app.delete('/:id', async (c) => {
    const { id } = c.req.param();
    const [deleted] = await db.delete(lessons).where(eq(lessons.id, id)).returning();

    if (!deleted) {
      return errorResponse(c, 'NOT_FOUND', 'Lesson not found', 404);
    }

    return successResponse(c, { id: deleted.id });
  });

  return app;
}

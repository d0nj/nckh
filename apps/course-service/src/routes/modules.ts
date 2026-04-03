import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { modules, lessons } from '@thai-binh/database';
import { successResponse, errorResponse } from '@thai-binh/utils';
import type { Database } from '@thai-binh/database';

export function moduleRoutes(db: Database) {
  const app = new Hono();

  // Get modules by course
  app.get('/', async (c) => {
    const { courseId } = c.req.query();
    if (!courseId) {
      return errorResponse(c, 'VALIDATION_ERROR', 'courseId is required', 400);
    }

    const courseModules = await db.select().from(modules).where(eq(modules.courseId, courseId));
    return successResponse(c, courseModules);
  });

  // Get module with lessons
  app.get('/:id', async (c) => {
    const { id } = c.req.param();
    
    const [module] = await db.select().from(modules).where(eq(modules.id, id));
    if (!module) {
      return errorResponse(c, 'NOT_FOUND', 'Module not found', 404);
    }

    const moduleLessons = await db.select().from(lessons).where(eq(lessons.moduleId, id));
    return successResponse(c, { ...module, lessons: moduleLessons });
  });

  // Create module
  app.post('/', async (c) => {
    const body = await c.req.json();
    
    const [module] = await db.insert(modules).values({
      ...body,
      createdAt: new Date(),
    }).returning();

    return successResponse(c, module, 201);
  });

  // Update module
  app.put('/:id', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();

    const [updated] = await db.update(modules)
      .set(body)
      .where(eq(modules.id, id))
      .returning();

    if (!updated) {
      return errorResponse(c, 'NOT_FOUND', 'Module not found', 404);
    }

    return successResponse(c, updated);
  });

  // Delete module
  app.delete('/:id', async (c) => {
    const { id } = c.req.param();
    const [deleted] = await db.delete(modules).where(eq(modules.id, id)).returning();

    if (!deleted) {
      return errorResponse(c, 'NOT_FOUND', 'Module not found', 404);
    }

    return successResponse(c, { id: deleted.id });
  });

  return app;
}

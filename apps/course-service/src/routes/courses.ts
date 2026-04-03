import { Hono } from 'hono';
import { eq, and, like } from 'drizzle-orm';
import { courses, modules, lessons } from '@thai-binh/database';
import { successResponse, errorResponse, paginatedResponse } from '@thai-binh/utils';
import type { Database } from '@thai-binh/database';

export function courseRoutes(db: Database) {
  const app = new Hono();

  // List courses
  app.get('/', async (c) => {
    const { page = '1', pageSize = '10', status, teacherId, search } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let query = db.select().from(courses);
    const conditions = [];

    if (status) conditions.push(eq(courses.status, status as any));
    if (teacherId) conditions.push(eq(courses.teacherId, teacherId));
    if (search) conditions.push(like(courses.title, `%${search}%`));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allCourses = await query.limit(parseInt(pageSize)).offset(offset);
    const countResult = await db.select({ count: courses.id }).from(courses);
    const total = countResult.length;

    return paginatedResponse(c, allCourses, total, parseInt(page), parseInt(pageSize));
  });

  // Get course by ID with modules
  app.get('/:id', async (c) => {
    const { id } = c.req.param();
    
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    if (!course) {
      return errorResponse(c, 'NOT_FOUND', 'Course not found', 404);
    }

    const courseModules = await db.select().from(modules).where(eq(modules.courseId, id));
    
    return successResponse(c, { ...course, modules: courseModules });
  });

  // Create course
  app.post('/', async (c) => {
    const body = await c.req.json();
    
    const [course] = await db.insert(courses).values({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return successResponse(c, course, 201);
  });

  // Update course
  app.put('/:id', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();

    const [updated] = await db.update(courses)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();

    if (!updated) {
      return errorResponse(c, 'NOT_FOUND', 'Course not found', 404);
    }

    return successResponse(c, updated);
  });

  // Delete course
  app.delete('/:id', async (c) => {
    const { id } = c.req.param();
    const [deleted] = await db.delete(courses).where(eq(courses.id, id)).returning();

    if (!deleted) {
      return errorResponse(c, 'NOT_FOUND', 'Course not found', 404);
    }

    return successResponse(c, { id: deleted.id });
  });

  return app;
}

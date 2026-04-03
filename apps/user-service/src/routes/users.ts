import { Hono } from 'hono';
import { eq, like, and } from 'drizzle-orm';
import { users } from '@thai-binh/database';
import { successResponse, errorResponse, paginatedResponse } from '@thai-binh/utils';
import type { Database } from '@thai-binh/database';

export function userRoutes(db: Database) {
  const app = new Hono();

  // List users with pagination and filters
  app.get('/', async (c) => {
    const { page = '1', pageSize = '10', role, search } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    let query = db.select().from(users);
    const conditions = [];
    
    if (role) {
      conditions.push(eq(users.role, role as 'admin' | 'teacher' | 'student'));
    }
    
    if (search) {
      conditions.push(like(users.name, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allUsers = await query.limit(parseInt(pageSize)).offset(offset);
    const [countResult] = await db.select({ count: users.id }).from(users);
    const total = countResult ? 1 : 0; // Simplified count

    return paginatedResponse(c, allUsers, total, parseInt(page), parseInt(pageSize));
  });

  // Get user by ID
  app.get('/:id', async (c) => {
    const { id } = c.req.param();
    const [user] = await db.select().from(users).where(eq(users.id, id));

    if (!user) {
      return errorResponse(c, 'NOT_FOUND', 'User not found', 404);
    }

    return successResponse(c, user);
  });

  // Create user
  app.post('/', async (c) => {
    const body = await c.req.json();
    
    const [user] = await db.insert(users).values({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return successResponse(c, user, 201);
  });

  // Update user
  app.put('/:id', async (c) => {
    const { id } = c.req.param();
    const body = await c.req.json();

    const [updated] = await db.update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) {
      return errorResponse(c, 'NOT_FOUND', 'User not found', 404);
    }

    return successResponse(c, updated);
  });

  // Delete user
  app.delete('/:id', async (c) => {
    const { id } = c.req.param();
    const [deleted] = await db.delete(users).where(eq(users.id, id)).returning();

    if (!deleted) {
      return errorResponse(c, 'NOT_FOUND', 'User not found', 404);
    }

    return successResponse(c, { id: deleted.id });
  });

  return app;
}

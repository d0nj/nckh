import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { users } from '@thai-binh/database';
import { successResponse, errorResponse } from '@thai-binh/utils';
import type { Database } from '@thai-binh/database';

export function profileRoutes(db: Database) {
  const app = new Hono();

  // Get profile by user ID
  app.get('/:userId', async (c) => {
    const { userId } = c.req.param();
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      avatar: users.avatar,
      phone: users.phone,
      department: users.department,
      isActive: users.isActive,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, userId));

    if (!user) {
      return errorResponse(c, 'NOT_FOUND', 'Profile not found', 404);
    }

    return successResponse(c, user);
  });

  // Update profile
  app.put('/:userId', async (c) => {
    const { userId } = c.req.param();
    const body = await c.req.json();

    // Only allow updating certain fields
    const allowedUpdates = {
      name: body.name,
      avatar: body.avatar,
      phone: body.phone,
      department: body.department,
      updatedAt: new Date(),
    };

    const [updated] = await db.update(users)
      .set(allowedUpdates)
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return errorResponse(c, 'NOT_FOUND', 'Profile not found', 404);
    }

    return successResponse(c, updated);
  });

  return app;
}

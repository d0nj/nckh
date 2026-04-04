import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, asc, count, sql } from 'drizzle-orm';
import { createDatabase, schema } from '@thai-binh/database/pg';

const app = new Hono();

// Add to waitlist schema
const addToWaitlistSchema = z.object({
  courseId: z.string().uuid(),
});

// Get waitlist for a course
app.get('/course/:courseId', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const courseId = c.req.param('courseId');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const waitlist = await db.query.waitlist.findMany({
    where: (w, { eq, and }) => and(
      eq(w.courseId, courseId),
      eq(w.organizationId, organizationId)
    ),
    orderBy: (w, { asc }) => [asc(w.position)],
  });
  
  return c.json({ waitlist, count: waitlist.length });
});

// Add to waitlist
app.post('/', zValidator('json', addToWaitlistSchema), async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const data = c.req.valid('json');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const userId = c.req.header('X-User-Id') || 'anonymous';
  
  // Check if user is already in waitlist
  const existing = await db.query.waitlist.findFirst({
    where: (w, { eq, and }) => and(
      eq(w.courseId, data.courseId),
      eq(w.userId, userId),
      eq(w.organizationId, organizationId)
    ),
  });
  
  if (existing) {
    return c.json({ error: 'Already in waitlist', position: existing.position }, 409);
  }
  
  // Get current max position
  const lastEntry = await db.query.waitlist.findFirst({
    where: (w, { eq, and }) => and(
      eq(w.courseId, data.courseId),
      eq(w.organizationId, organizationId)
    ),
    orderBy: (w, { desc }) => [desc(w.position)],
  });
  
  const position = (lastEntry?.position || 0) + 1;
  
  const [entry] = await db.insert(schema.waitlist).values({
    organizationId,
    courseId: data.courseId,
    userId,
    position,
    status: 'waiting' as const,
  }).returning();
  
  // Check if we should trigger auto-class creation
  const waitlistCount = await db.select({ count: count() })
    .from(schema.waitlist)
    .where(and(
      eq(schema.waitlist.courseId, data.courseId),
      eq(schema.waitlist.organizationId, organizationId),
      eq(schema.waitlist.status, 'waiting')
    ));
  
  const course = await db.query.courses.findFirst({
    where: (c, { eq }) => eq(c.id, data.courseId),
  });
  
  const shouldTriggerAutoClass = course && 
    course.admissionMode === 'rolling' && 
    waitlistCount[0].count >= (course.waitlistThreshold || 0);
  
  return c.json({
    message: 'Added to waitlist',
    entry,
    position,
    autoClassTrigger: shouldTriggerAutoClass,
  }, 201);
});

// Remove from waitlist
app.delete('/:id', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const userId = c.req.header('X-User-Id');
  
  const entry = await db.query.waitlist.findFirst({
    where: (w, { eq, and }) => and(
      eq(w.id, id),
      eq(w.organizationId, organizationId)
    ),
  });
  
  if (!entry) {
    return c.json({ error: 'Waitlist entry not found' }, 404);
  }
  
  // Only allow removal by the user themselves or an admin
  if (entry.userId !== userId) {
    // TODO: Check if user is admin
  }
  
  await db.delete(schema.waitlist)
    .where(eq(schema.waitlist.id, id));
  
  // Reorder positions
  await db.execute(sql`
    UPDATE academic.waitlist 
    SET position = position - 1 
    WHERE course_id = ${entry.courseId} 
    AND position > ${entry.position}
    AND organization_id = ${organizationId}
  `);
  
  return c.json({ message: 'Removed from waitlist' });
});

// Offer spot from waitlist
app.post('/:id/offer', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const [entry] = await db.update(schema.waitlist)
    .set({
      status: 'offered' as const,
      offeredAt: new Date(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
    })
    .where(and(
      eq(schema.waitlist.id, id),
      eq(schema.waitlist.organizationId, organizationId)
    ))
    .returning();
  
  if (!entry) {
    return c.json({ error: 'Waitlist entry not found' }, 404);
  }
  
  return c.json({ message: 'Spot offered', entry });
});

// Accept offer and enroll
app.post('/:id/accept', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const userId = c.req.header('X-User-Id');
  
  const entry = await db.query.waitlist.findFirst({
    where: (w, { eq, and }) => and(
      eq(w.id, id),
      eq(w.organizationId, organizationId)
    ),
  });
  
  if (!entry) {
    return c.json({ error: 'Waitlist entry not found' }, 404);
  }
  
  if (entry.userId !== userId) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  if (entry.status !== 'offered') {
    return c.json({ error: 'No offer available' }, 400);
  }
  
  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
    return c.json({ error: 'Offer expired' }, 400);
  }
  
  // Update waitlist status
  await db.update(schema.waitlist)
    .set({ status: 'enrolled' as const })
    .where(eq(schema.waitlist.id, id));
  
  // TODO: Create enrollment via enrollment service
  // This should call the enrollment service API
  
  return c.json({
    message: 'Enrolled successfully',
    waitlistEntry: entry,
  });
});

// Check auto-class creation trigger
app.get('/check-auto-class/:courseId', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const courseId = c.req.param('courseId');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const course = await db.query.courses.findFirst({
    where: (c, { eq }) => eq(c.id, courseId),
  });
  
  if (!course) {
    return c.json({ error: 'Course not found' }, 404);
  }
  
  const waitlistCount = await db.select({ count: count() })
    .from(schema.waitlist)
    .where(and(
      eq(schema.waitlist.courseId, courseId),
      eq(schema.waitlist.organizationId, organizationId),
      eq(schema.waitlist.status, 'waiting')
    ));
  
  const shouldCreateClass = course.admissionMode === 'rolling' && 
    waitlistCount[0].count >= (course.waitlistThreshold || 0);
  
  return c.json({
    courseId,
    waitlistCount: waitlistCount[0].count,
    waitlistThreshold: course.waitlistThreshold,
    shouldCreateClass,
    minStudents: course.minStudents,
    maxStudents: course.maxStudents,
  });
});

export { app as waitlistRoutes };
export default app;

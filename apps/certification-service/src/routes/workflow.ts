import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { createDatabase, schema } from '@thai-binh/database/pg';

const app = new Hono();

// Pre-check schema
const preCheckSchema = z.object({
  studentId: z.string().uuid(),
  courseId: z.string().uuid(),
  paymentVerified: z.boolean(),
  documentsComplete: z.boolean(),
  gradeVerified: z.boolean(),
  notes: z.string().optional(),
});

// Get all workflow steps for a certificate
app.get('/certificate/:id', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const certificateId = c.req.param('id');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const steps = await db.query.certificateWorkflowSteps.findMany({
    where: (steps, { eq, and }) => and(
      eq(steps.certificateId, certificateId),
      eq(steps.organizationId, organizationId)
    ),
    orderBy: (steps, { asc }) => [asc(steps.createdAt)],
  });
  
  return c.json({ steps });
});

// Create pre-check record
app.post('/pre-check', zValidator('json', preCheckSchema), async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const data = c.req.valid('json');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const checkedBy = c.req.header('X-User-Id') || 'system';
  
  const eligibleForCertificate = data.paymentVerified && data.documentsComplete && data.gradeVerified;
  
  const [record] = await db.insert(schema.preCheckRecords).values({
    organizationId,
    studentId: data.studentId,
    courseId: data.courseId,
    paymentVerified: data.paymentVerified,
    documentsComplete: data.documentsComplete,
    gradeVerified: data.gradeVerified,
    eligibleForCertificate,
    checkedBy,
    notes: data.notes,
  }).returning();
  
  return c.json({
    message: eligibleForCertificate 
      ? 'Student is eligible for certificate' 
      : 'Student is not eligible for certificate',
    record,
  }, 201);
});

// Get pre-check record
app.get('/pre-check/:studentId/:courseId', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const studentId = c.req.param('studentId');
  const courseId = c.req.param('courseId');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const record = await db.query.preCheckRecords.findFirst({
    where: (checks, { eq, and }) => and(
      eq(checks.studentId, studentId),
      eq(checks.courseId, courseId),
      eq(checks.organizationId, organizationId)
    ),
  });
  
  if (!record) {
    return c.json({ error: 'Pre-check record not found' }, 404);
  }
  
  return c.json({ record });
});

// Update workflow step status
app.patch('/steps/:id', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const body = await c.req.json();
  const performedBy = c.req.header('X-User-Id') || 'system';
  
  const [step] = await db.update(schema.certificateWorkflowSteps)
    .set({
      status: body.status,
      performedBy,
      performedAt: new Date(),
      notes: body.notes,
      metadata: body.metadata,
    })
    .where(eq(schema.certificateWorkflowSteps.id, id))
    .returning();
  
  if (!step) {
    return c.json({ error: 'Workflow step not found' }, 404);
  }
  
  return c.json({ step });
});

// Get workflow statistics
app.get('/stats', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  // Count certificates by status
  const drafts = await db.query.certificates.findMany({
    where: (certs, { eq, and }) => and(
      eq(certs.organizationId, organizationId),
      eq(certs.status, 'draft')
    ),
  });
  
  const pending = await db.query.certificates.findMany({
    where: (certs, { eq, and }) => and(
      eq(certs.organizationId, organizationId),
      eq(certs.status, 'pending_approval')
    ),
  });
  
  const approved = await db.query.certificates.findMany({
    where: (certs, { eq, and }) => and(
      eq(certs.organizationId, organizationId),
      eq(certs.status, 'approved')
    ),
  });
  
  const issued = await db.query.certificates.findMany({
    where: (certs, { eq, and }) => and(
      eq(certs.organizationId, organizationId),
      eq(certs.status, 'issued')
    ),
  });
  
  return c.json({
    stats: {
      draft: drafts.length,
      pendingApproval: pending.length,
      approved: approved.length,
      issued: issued.length,
      total: drafts.length + pending.length + approved.length + issued.length,
    }
  });
});

export { app as workflowRoutes };

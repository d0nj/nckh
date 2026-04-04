import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { createDatabase, schema } from '@thai-binh/database/pg';

const app = new Hono();

// Issue certificate schema
const issueCertificateSchema = z.object({
  studentId: z.string().uuid(),
  courseId: z.string().uuid(),
  certificateType: z.enum(['certificate', 'diploma']),
  decisionNumber: z.string().min(1),
  decisionDate: z.string().datetime(),
  classification: z.enum(['excellent', 'good', 'fair', 'pass']),
  notes: z.string().optional(),
});

// Get all certificates
app.get('/', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  
  const query = db.query.certificates.findMany({
    where: (certs, { eq, and }) => {
      const conditions = [eq(certs.organizationId, organizationId)];
      if (status) {
        conditions.push(eq(certs.status, status));
      }
      return and(...conditions);
    },
    with: {
      registryEntry: true,
    },
    orderBy: (certs, { desc }) => [desc(certs.createdAt)],
    limit,
    offset,
  });
  
  const certificates = await query;
  return c.json({ certificates, page, limit });
});

// Get certificate by ID
app.get('/:id', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const certificate = await db.query.certificates.findFirst({
    where: (certs, { eq, and }) => and(
      eq(certs.id, id),
      eq(certs.organizationId, organizationId)
    ),
    with: {
      registryEntry: true,
      workflowSteps: true,
    },
  });
  
  if (!certificate) {
    return c.json({ error: 'Certificate not found' }, 404);
  }
  
  return c.json({ certificate });
});

// Issue certificate (full workflow)
app.post('/', zValidator('json', issueCertificateSchema), async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const data = c.req.valid('json');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const issuedBy = c.req.header('X-User-Id') || 'system';
  
  // Step 1: Pre-check
  const preCheck = await db.query.preCheckRecords.findFirst({
    where: (checks, { eq, and }) => and(
      eq(checks.studentId, data.studentId),
      eq(checks.courseId, data.courseId),
      eq(checks.organizationId, organizationId),
      eq(checks.eligibleForCertificate, true)
    ),
  });
  
  if (!preCheck) {
    return c.json({ 
      error: 'Student not eligible for certificate',
      message: 'Pre-check record not found or student not eligible'
    }, 400);
  }
  
  // Step 2: Find available blank
  const blank = await db.query.certificateBlanks.findFirst({
    where: (blanks, { eq, and }) => and(
      eq(blanks.organizationId, organizationId),
      eq(blanks.status, 'in_stock')
    ),
  });
  
  if (!blank) {
    return c.json({ error: 'No certificate blanks available' }, 500);
  }
  
  // Step 3: Find open registry book
  const book = await db.query.registryBooks.findFirst({
    where: (books, { eq, and }) => and(
      eq(books.organizationId, organizationId),
      eq(books.isClosed, false)
    ),
  });
  
  if (!book) {
    return c.json({ error: 'No open registry book found' }, 500);
  }
  
  // Step 4: Generate entry number
  const lastEntry = await db.query.registryBookEntries.findFirst({
    where: (entries, { eq }) => eq(entries.registryBookId, book.id),
    orderBy: (entries, { desc }) => [desc(entries.entryNumber)],
  });
  
  const entryNumber = lastEntry 
    ? (parseInt(lastEntry.entryNumber) + 1).toString().padStart(4, '0')
    : '0001';
  
  // Execute in transaction
  const result = await db.transaction(async (tx) => {
    // Create registry entry
    const [entry] = await tx.insert(schema.registryBookEntries).values({
      organizationId,
      registryBookId: book.id,
      entryNumber,
      studentId: data.studentId,
      fullName: preCheck.studentId, // Will need to fetch from student
      dateOfBirth: new Date(),
      gender: 'male',
      courseId: data.courseId,
      courseName: '',
      decisionNumber: data.decisionNumber,
      decisionDate: new Date(data.decisionDate),
      classification: data.classification,
      certificateSerialNumber: blank.serialNumber,
      version: 1,
      isLatest: true,
    }).returning();
    
    // Update blank status
    await tx.update(schema.certificateBlanks)
      .set({
        status: 'used',
        usedForCertificateId: entry.id,
        usedAt: new Date(),
      })
      .where(eq(schema.certificateBlanks.id, blank.id));
    
    // Create certificate
    const [certificate] = await tx.insert(schema.certificates).values({
      organizationId,
      registryEntryId: entry.id,
      studentId: data.studentId,
      courseId: data.courseId,
      certificateSerialNumber: blank.serialNumber,
      certificateType: data.certificateType,
      status: 'draft',
      issuedBy,
    }).returning();
    
    // Create workflow steps
    await tx.insert(schema.certificateWorkflowSteps).values([
      {
        certificateId: certificate.id,
        organizationId,
        step: 'pre_check',
        status: 'completed',
        performedBy: issuedBy,
        performedAt: new Date(),
      },
      {
        certificateId: certificate.id,
        organizationId,
        step: 'assign_serial',
        status: 'completed',
        performedBy: issuedBy,
        performedAt: new Date(),
      },
      {
        certificateId: certificate.id,
        organizationId,
        step: 'draft',
        status: 'completed',
        performedBy: issuedBy,
        performedAt: new Date(),
      },
      {
        certificateId: certificate.id,
        organizationId,
        step: 'approve',
        status: 'pending',
      },
      {
        certificateId: certificate.id,
        organizationId,
        step: 'sign',
        status: 'pending',
      },
      {
        certificateId: certificate.id,
        organizationId,
        step: 'issue',
        status: 'pending',
      },
    ]);
    
    return { certificate, entry, blank };
  });
  
  return c.json({
    message: 'Certificate draft created successfully',
    certificate: result.certificate,
    entryNumber,
    serialNumber: blank.serialNumber,
  }, 201);
});

// Approve certificate
app.post('/:id/approve', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const approvedBy = c.req.header('X-User-Id') || 'system';
  
  const [certificate] = await db.update(schema.certificates)
    .set({ status: 'approved' })
    .where(and(
      eq(schema.certificates.id, id),
      eq(schema.certificates.organizationId, organizationId)
    ))
    .returning();
  
  if (!certificate) {
    return c.json({ error: 'Certificate not found' }, 404);
  }
  
  await db.update(schema.certificateWorkflowSteps)
    .set({
      status: 'completed',
      performedBy: approvedBy,
      performedAt: new Date(),
    })
    .where(and(
      eq(schema.certificateWorkflowSteps.certificateId, id),
      eq(schema.certificateWorkflowSteps.step, 'approve')
    ));
  
  return c.json({ message: 'Certificate approved', certificate });
});

// Sign certificate
app.post('/:id/sign', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const signedBy = c.req.header('X-User-Id') || 'system';
  
  const [certificate] = await db.update(schema.certificates)
    .set({
      signedAt: new Date(),
      signedBy,
    })
    .where(and(
      eq(schema.certificates.id, id),
      eq(schema.certificates.organizationId, organizationId)
    ))
    .returning();
  
  if (!certificate) {
    return c.json({ error: 'Certificate not found' }, 404);
  }
  
  await db.update(schema.certificateWorkflowSteps)
    .set({
      status: 'completed',
      performedBy: signedBy,
      performedAt: new Date(),
    })
    .where(and(
      eq(schema.certificateWorkflowSteps.certificateId, id),
      eq(schema.certificateWorkflowSteps.step, 'sign')
    ));
  
  return c.json({ message: 'Certificate signed', certificate });
});

// Issue certificate (final step)
app.post('/:id/issue', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const issuedBy = c.req.header('X-User-Id') || 'system';
  
  const [certificate] = await db.update(schema.certificates)
    .set({
      status: 'issued',
      issueDate: new Date(),
    })
    .where(and(
      eq(schema.certificates.id, id),
      eq(schema.certificates.organizationId, organizationId)
    ))
    .returning();
  
  if (!certificate) {
    return c.json({ error: 'Certificate not found' }, 404);
  }
  
  // Update registry entry with issue date
  await db.update(schema.registryBookEntries)
    .set({ issueDate: new Date() })
    .where(eq(schema.registryBookEntries.id, certificate.registryEntryId));
  
  await db.update(schema.certificateWorkflowSteps)
    .set({
      status: 'completed',
      performedBy: issuedBy,
      performedAt: new Date(),
    })
    .where(and(
      eq(schema.certificateWorkflowSteps.certificateId, id),
      eq(schema.certificateWorkflowSteps.step, 'issue')
    ));
  
  return c.json({ message: 'Certificate issued successfully', certificate });
});

// Cancel certificate
app.post('/:id/cancel', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const [certificate] = await db.update(schema.certificates)
    .set({ status: 'cancelled' })
    .where(and(
      eq(schema.certificates.id, id),
      eq(schema.certificates.organizationId, organizationId)
    ))
    .returning();
  
  if (!certificate) {
    return c.json({ error: 'Certificate not found' }, 404);
  }
  
  return c.json({ message: 'Certificate cancelled', certificate });
});

// Verify certificate (public endpoint)
app.get('/verify/:serialNumber', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const serialNumber = c.req.param('serialNumber');
  
  const certificate = await db.query.certificates.findFirst({
    where: (certs, { eq }) => eq(certs.certificateSerialNumber, serialNumber),
    with: {
      registryEntry: true,
    },
  });
  
  if (!certificate) {
    return c.json({ 
      valid: false,
      message: 'Certificate not found'
    }, 404);
  }
  
  if (certificate.status !== 'issued') {
    return c.json({
      valid: false,
      status: certificate.status,
      message: 'Certificate is not active'
    });
  }
  
  return c.json({
    valid: true,
    certificate: {
      serialNumber: certificate.certificateSerialNumber,
      certificateNumber: certificate.certificateNumber,
      issueDate: certificate.issueDate,
      studentName: certificate.registryEntry?.fullName,
      courseName: certificate.registryEntry?.courseName,
      classification: certificate.registryEntry?.classification,
    }
  });
});

export { app as certificateRoutes };

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createDatabase, schema } from '@thai-binh/database/pg';

const app = new Hono();

// Schema validation
const importBatchSchema = z.object({
  batchNumber: z.string().min(1),
  serialNumberStart: z.string().min(1),
  serialNumberEnd: z.string().min(1),
  certificateType: z.enum(['certificate', 'diploma']),
  notes: z.string().optional(),
});

const transferBlankSchema = z.object({
  blankId: z.string().uuid(),
  transferredTo: z.string().min(1),
  notes: z.string().optional(),
});

const cancelBlankSchema = z.object({
  reason: z.string().min(1),
  witness1: z.string().optional(),
  witness2: z.string().optional(),
});

// Get all blank batches
app.get('/batches', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const batches = await db.query.certificateBlankBatches.findMany({
    where: (batches, { eq }) => eq(batches.organizationId, organizationId),
    orderBy: (batches, { desc }) => [desc(batches.importedAt)],
  });
  
  return c.json({ batches });
});

// Import new batch (Nhập kho phôi)
app.post('/batches', zValidator('json', importBatchSchema), async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const data = c.req.valid('json');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const importedBy = c.req.header('X-User-Id') || 'system';
  
  // Calculate quantity from serial numbers
  const start = parseInt(data.serialNumberStart);
  const end = parseInt(data.serialNumberEnd);
  const quantity = end - start + 1;
  
  if (quantity <= 0 || quantity > 10000) {
    return c.json({ error: 'Invalid serial number range' }, 400);
  }
  
  // Create batch
  const [batch] = await db.insert(schema.certificateBlankBatches).values({
    organizationId,
    batchNumber: data.batchNumber,
    serialNumberStart: data.serialNumberStart,
    serialNumberEnd: data.serialNumberEnd,
    quantity,
    certificateType: data.certificateType,
    importedBy,
    notes: data.notes,
  }).returning();
  
  // Create individual blank records
  const blanks = [];
  for (let i = start; i <= end; i++) {
    const serialNumber = i.toString().padStart(data.serialNumberStart.length, '0');
    blanks.push({
      organizationId,
      batchId: batch.id,
      serialNumber,
      status: 'in_stock',
    });
  }
  
  await db.insert(schema.certificateBlanks).values(blanks);
  
  return c.json({ 
    message: 'Batch imported successfully',
    batch,
    blanksCreated: blanks.length 
  }, 201);
});

// Get all blanks
app.get('/', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const status = c.req.query('status');
  
  const query = db.query.certificateBlanks.findMany({
    where: (blanks, { eq, and }) => {
      const conditions = [eq(blanks.organizationId, organizationId)];
      if (status) {
        conditions.push(eq(blanks.status, status));
      }
      return and(...conditions);
    },
    with: {
      batch: true,
    },
    orderBy: (blanks, { desc }) => [desc(blanks.createdAt)],
  });
  
  const blanks = await query;
  return c.json({ blanks });
});

// Get blank by ID
app.get('/:id', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const blank = await db.query.certificateBlanks.findFirst({
    where: (blanks, { eq, and }) => and(
      eq(blanks.id, id),
      eq(blanks.organizationId, organizationId)
    ),
    with: {
      batch: true,
    },
  });
  
  if (!blank) {
    return c.json({ error: 'Blank not found' }, 404);
  }
  
  return c.json({ blank });
});

// Transfer blank (Cấp phát nội bộ)
app.post('/:id/transfer', zValidator('json', transferBlankSchema), async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const transferredBy = c.req.header('X-User-Id') || 'system';
  
  // Check if blank exists and is available
  const blank = await db.query.certificateBlanks.findFirst({
    where: (blanks, { eq, and }) => and(
      eq(blanks.id, id),
      eq(blanks.organizationId, organizationId)
    ),
  });
  
  if (!blank) {
    return c.json({ error: 'Blank not found' }, 404);
  }
  
  if (blank.status !== 'in_stock') {
    return c.json({ error: 'Blank is not available for transfer' }, 400);
  }
  
  // Update blank status
  const [updated] = await db.update(schema.certificateBlanks)
    .set({
      status: 'assigned',
      assignedTo: data.transferredTo,
      assignedAt: new Date(),
    })
    .where(eq(schema.certificateBlanks.id, id))
    .returning();
  
  return c.json({
    message: 'Blank transferred successfully',
    blank: updated,
  });
});

// Cancel blank (Hủy phôi - CANNOT DELETE per Thông tư 21)
app.post('/:id/cancel', zValidator('json', cancelBlankSchema), async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const cancelledBy = c.req.header('X-User-Id') || 'system';
  
  // Check if blank exists
  const blank = await db.query.certificateBlanks.findFirst({
    where: (blanks, { eq, and }) => and(
      eq(blanks.id, id),
      eq(blanks.organizationId, organizationId)
    ),
  });
  
  if (!blank) {
    return c.json({ error: 'Blank not found' }, 404);
  }
  
  if (blank.status === 'used') {
    return c.json({ error: 'Cannot cancel a blank that has been used' }, 400);
  }
  
  if (blank.status === 'cancelled') {
    return c.json({ error: 'Blank is already cancelled' }, 400);
  }
  
  // Update blank status to cancelled (never delete!)
  const [updated] = await db.update(schema.certificateBlanks)
    .set({
      status: 'cancelled',
      cancellationReason: data.reason,
      cancelledAt: new Date(),
      cancelledBy,
    })
    .where(eq(schema.certificateBlanks.id, id))
    .returning();
  
  return c.json({
    message: 'Blank cancelled successfully (per Thông tư 21/2019 - cannot delete)',
    blank: updated,
  });
});

// Get cancelled blanks (for audit)
app.get('/cancelled/list', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const blanks = await db.query.certificateBlanks.findMany({
    where: (blanks, { eq, and }) => and(
      eq(blanks.organizationId, organizationId),
      eq(blanks.status, 'cancelled')
    ),
    orderBy: (blanks, { desc }) => [desc(blanks.cancelledAt)],
  });
  
  return c.json({ blanks, count: blanks.length });
});

export { app as blankRoutes };

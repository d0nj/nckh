import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, desc, asc } from 'drizzle-orm';
import { createDatabase, schema } from '@thai-binh/database/pg';

const app = new Hono();

// Create new registry book
const createBookSchema = z.object({
  bookNumber: z.string().min(1),
  year: z.number().int().min(2020).max(2100),
  storageLocation: z.string().optional(),
});

// Add entry to registry
const addEntrySchema = z.object({
  studentId: z.string().uuid(),
  fullName: z.string().min(1),
  dateOfBirth: z.string().datetime(),
  placeOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']),
  nationality: z.string().default('Vietnamese'),
  ethnicity: z.string().optional(),
  courseId: z.string().uuid(),
  courseName: z.string().min(1),
  decisionNumber: z.string().min(1),
  decisionDate: z.string().datetime(),
  classification: z.enum(['excellent', 'good', 'fair', 'pass']),
  certificateSerialNumber: z.string().min(1),
  certificateNumber: z.string().optional(),
  issueDate: z.string().datetime().optional(),
});

// Correct entry
const correctEntrySchema = z.object({
  correctionReason: z.string().min(1),
  corrections: z.object({
    fullName: z.string().optional(),
    dateOfBirth: z.string().datetime().optional(),
    placeOfBirth: z.string().optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    nationality: z.string().optional(),
    ethnicity: z.string().optional(),
    courseName: z.string().optional(),
    classification: z.enum(['excellent', 'good', 'fair', 'pass']).optional(),
  }),
});

// Get all registry books
app.get('/books', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const books = await db.query.registryBooks.findMany({
    where: (books, { eq }) => eq(books.organizationId, organizationId),
    orderBy: (books, { desc }) => [desc(books.year), desc(books.openedAt)],
    with: {
      entries: {
        limit: 5,
        orderBy: (entries, { desc }) => [desc(entries.createdAt)],
      },
    },
  });
  
  return c.json({ books });
});

// Create new registry book
app.post('/books', zValidator('json', createBookSchema), async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const data = c.req.valid('json');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const [book] = await db.insert(schema.registryBooks).values({
    organizationId,
    bookNumber: data.bookNumber,
    year: data.year,
    storageLocation: data.storageLocation,
  }).returning();
  
  return c.json({ book }, 201);
});

// Get registry book by ID
app.get('/books/:id', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const book = await db.query.registryBooks.findFirst({
    where: (books, { eq, and }) => and(
      eq(books.id, id),
      eq(books.organizationId, organizationId)
    ),
    with: {
      entries: {
        orderBy: (entries, { asc }) => [asc(entries.entryNumber)],
      },
    },
  });
  
  if (!book) {
    return c.json({ error: 'Registry book not found' }, 404);
  }
  
  return c.json({ book });
});

// Close registry book
app.post('/books/:id/close', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const [book] = await db.update(schema.registryBooks)
    .set({
      isClosed: true,
      closedAt: new Date(),
    })
    .where(and(
      eq(schema.registryBooks.id, id),
      eq(schema.registryBooks.organizationId, organizationId)
    ))
    .returning();
  
  if (!book) {
    return c.json({ error: 'Registry book not found' }, 404);
  }
  
  return c.json({ message: 'Registry book closed', book });
});

// Get all entries with pagination
app.get('/entries', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;
  
  const entries = await db.query.registryBookEntries.findMany({
    where: (entries, { eq }) => eq(entries.organizationId, organizationId),
    orderBy: (entries, { desc }) => [desc(entries.createdAt)],
    limit,
    offset,
  });
  
  return c.json({ entries, page, limit });
});

// Get entry by ID
app.get('/entries/:id', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  const entry = await db.query.registryBookEntries.findFirst({
    where: (entries, { eq, and }) => and(
      eq(entries.id, id),
      eq(entries.organizationId, organizationId)
    ),
    with: {
      registryBook: true,
    },
  });
  
  if (!entry) {
    return c.json({ error: 'Entry not found' }, 404);
  }
  
  // Get version history if this is a corrected entry
  let versionHistory = [];
  if (entry.parentEntryId) {
    versionHistory = await db.query.registryBookEntries.findMany({
      where: (entries, { eq, or }) => or(
        eq(entries.id, entry.parentEntryId),
        eq(entries.parentEntryId, entry.parentEntryId)
      ),
      orderBy: (entries, { asc }) => [asc(entries.version)],
    });
  }
  
  return c.json({ entry, versionHistory });
});

// Add entry to registry
app.post('/entries', zValidator('json', addEntrySchema), async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const data = c.req.valid('json');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  
  // Find open registry book
  const book = await db.query.registryBooks.findFirst({
    where: (books, { eq, and }) => and(
      eq(books.organizationId, organizationId),
      eq(books.isClosed, false)
    ),
  });
  
  if (!book) {
    return c.json({ error: 'No open registry book found' }, 400);
  }
  
  // Generate entry number
  const lastEntry = await db.query.registryBookEntries.findFirst({
    where: (entries, { eq }) => eq(entries.registryBookId, book.id),
    orderBy: (entries, { desc }) => [desc(entries.entryNumber)],
  });
  
  const entryNumber = lastEntry 
    ? (parseInt(lastEntry.entryNumber) + 1).toString().padStart(4, '0')
    : '0001';
  
  const [entry] = await db.insert(schema.registryBookEntries).values({
    organizationId,
    registryBookId: book.id,
    entryNumber,
    studentId: data.studentId,
    fullName: data.fullName,
    dateOfBirth: new Date(data.dateOfBirth),
    placeOfBirth: data.placeOfBirth,
    gender: data.gender,
    nationality: data.nationality,
    ethnicity: data.ethnicity,
    courseId: data.courseId,
    courseName: data.courseName,
    decisionNumber: data.decisionNumber,
    decisionDate: new Date(data.decisionDate),
    classification: data.classification,
    certificateSerialNumber: data.certificateSerialNumber,
    certificateNumber: data.certificateNumber,
    issueDate: data.issueDate ? new Date(data.issueDate) : null,
    version: 1,
    isLatest: true,
  }).returning();
  
  return c.json({ entry }, 201);
});

// Correct entry (versioning - never update in place!)
app.post('/entries/:id/correct', zValidator('json', correctEntrySchema), async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const correctedBy = c.req.header('X-User-Id') || 'system';
  
  // Get original entry
  const originalEntry = await db.query.registryBookEntries.findFirst({
    where: (entries, { eq, and }) => and(
      eq(entries.id, id),
      eq(entries.organizationId, organizationId)
    ),
  });
  
  if (!originalEntry) {
    return c.json({ error: 'Entry not found' }, 404);
  }
  
  // Mark original as not latest
  await db.update(schema.registryBookEntries)
    .set({ isLatest: false })
    .where(eq(schema.registryBookEntries.id, id));
  
  // Create new version
  const [newEntry] = await db.insert(schema.registryBookEntries).values({
    organizationId,
    registryBookId: originalEntry.registryBookId,
    entryNumber: originalEntry.entryNumber,
    studentId: originalEntry.studentId,
    fullName: data.corrections.fullName || originalEntry.fullName,
    dateOfBirth: data.corrections.dateOfBirth 
      ? new Date(data.corrections.dateOfBirth) 
      : originalEntry.dateOfBirth,
    placeOfBirth: data.corrections.placeOfBirth || originalEntry.placeOfBirth,
    gender: data.corrections.gender || originalEntry.gender,
    nationality: data.corrections.nationality || originalEntry.nationality,
    ethnicity: data.corrections.ethnicity || originalEntry.ethnicity,
    courseId: originalEntry.courseId,
    courseName: data.corrections.courseName || originalEntry.courseName,
    decisionNumber: originalEntry.decisionNumber,
    decisionDate: originalEntry.decisionDate,
    classification: data.corrections.classification || originalEntry.classification,
    certificateSerialNumber: originalEntry.certificateSerialNumber,
    certificateNumber: originalEntry.certificateNumber,
    issueDate: originalEntry.issueDate,
    version: originalEntry.version + 1,
    parentEntryId: originalEntry.id,
    correctionReason: data.correctionReason,
    correctedBy,
    isLatest: true,
  }).returning();
  
  return c.json({
    message: 'Entry corrected successfully (new version created)',
    originalEntry: { ...originalEntry, isLatest: false },
    newEntry,
  });
});

// Search registry
app.get('/search', async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const organizationId = c.req.header('X-Organization-Id') || 'default';
  const query = c.req.query('q');
  
  if (!query) {
    return c.json({ error: 'Query parameter required' }, 400);
  }
  
  // Simple search by name or certificate number
  const entries = await db.query.registryBookEntries.findMany({
    where: (entries, { eq, and, or, like }) => and(
      eq(entries.organizationId, organizationId),
      or(
        like(entries.fullName, `%${query}%`),
        like(entries.certificateSerialNumber, `%${query}%`),
        like(entries.certificateNumber || '', `%${query}%`)
      )
    ),
    orderBy: (entries, { desc }) => [desc(entries.createdAt)],
    limit: 20,
  });
  
  return c.json({ entries, count: entries.length });
});

export { app as registryRoutes };

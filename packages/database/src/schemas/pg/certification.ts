import { pgSchema, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, organizations } from './auth';
import { students } from './student';
import { courses } from './academic';

export const certificationSchema = pgSchema('certification');

// ========== PHÔI VĂN BẰNG (Certificate Blanks) ==========
export const certificateBlankBatches = certificationSchema.table('certificate_blank_batches', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  batchNumber: text('batch_number').notNull(),
  serialNumberStart: text('serial_number_start').notNull(),
  serialNumberEnd: text('serial_number_end').notNull(),
  quantity: integer('quantity').notNull(),
  certificateType: text('certificate_type', { enum: ['certificate', 'diploma'] }).notNull(),
  importedAt: timestamp('imported_at').notNull().defaultNow(),
  importedBy: text('imported_by').notNull(),
  status: text('status', { enum: ['available', 'partially_used', 'fully_used', 'cancelled'] }).default('available'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const certificateBlanks = certificationSchema.table('certificate_blanks', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  batchId: text('batch_id').notNull(),
  serialNumber: text('serial_number').notNull().unique(),
  status: text('status', { enum: ['in_stock', 'assigned', 'used', 'damaged', 'cancelled'] }).default('in_stock'),
  assignedTo: text('assigned_to'),
  assignedAt: timestamp('assigned_at'),
  usedForCertificateId: text('used_for_certificate_id'),
  usedAt: timestamp('used_at'),
  cancellationReason: text('cancellation_reason'),
  cancelledAt: timestamp('cancelled_at'),
  cancelledBy: text('cancelled_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ========== SỔ GỐC (Registry Book) ==========
export const registryBooks = certificationSchema.table('registry_books', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  bookNumber: text('book_number').notNull(),
  year: integer('year').notNull(),
  openedAt: timestamp('opened_at').notNull().defaultNow(),
  closedAt: timestamp('closed_at'),
  isClosed: boolean('is_closed').default(false),
  storageLocation: text('storage_location'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const registryBookEntries = certificationSchema.table('registry_book_entries', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  registryBookId: text('registry_book_id').notNull(),
  entryNumber: text('entry_number').notNull(),
  
  // Student info (snapshot - immutable)
  studentId: text('student_id').notNull(),
  fullName: text('full_name').notNull(),
  dateOfBirth: timestamp('date_of_birth').notNull(),
  placeOfBirth: text('place_of_birth'),
  gender: text('gender', { enum: ['male', 'female', 'other'] }).notNull(),
  nationality: text('nationality').default('Vietnamese'),
  ethnicity: text('ethnicity'),
  
  // Course info (snapshot)
  courseId: text('course_id').notNull(),
  courseName: text('course_name').notNull(),
  
  // Graduation decision
  decisionNumber: text('decision_number').notNull(),
  decisionDate: timestamp('decision_date').notNull(),
  classification: text('classification', { enum: ['excellent', 'good', 'fair', 'pass'] }).notNull(),
  
  // Certificate info
  certificateSerialNumber: text('certificate_serial_number').notNull().unique(),
  certificateNumber: text('certificate_number'),
  issueDate: timestamp('issue_date'),
  
  // Versioning for corrections
  version: integer('version').notNull().default(1),
  parentEntryId: text('parent_entry_id'),
  correctionReason: text('correction_reason'),
  correctedBy: text('corrected_by'),
  isLatest: boolean('is_latest').notNull().default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ========== CERTIFICATES ==========
export const certificates = certificationSchema.table('certificates', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  registryEntryId: text('registry_entry_id').notNull().unique(),
  studentId: text('student_id').notNull(),
  courseId: text('course_id').notNull(),
  certificateSerialNumber: text('certificate_serial_number').notNull().unique(),
  certificateNumber: text('certificate_number'),
  certificateType: text('certificate_type', { enum: ['certificate', 'diploma'] }).notNull(),
  status: text('status', { enum: ['draft', 'pending_approval', 'approved', 'issued', 'cancelled'] }).default('draft'),
  issueDate: timestamp('issue_date'),
  issuedBy: text('issued_by'),
  signedAt: timestamp('signed_at'),
  signedBy: text('signed_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Certificate workflow steps
export const certificateWorkflowSteps = certificationSchema.table('certificate_workflow_steps', {
  id: text('id').primaryKey(),
  certificateId: text('certificate_id').notNull(),
  organizationId: text('organization_id').notNull(),
  step: text('step', { enum: ['pre_check', 'draft', 'assign_serial', 'approve', 'sign', 'issue'] }).notNull(),
  status: text('status', { enum: ['pending', 'completed', 'rejected'] }).default('pending'),
  performedBy: text('performed_by'),
  performedAt: timestamp('performed_at'),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Pre-check records
export const preCheckRecords = certificationSchema.table('pre_check_records', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  studentId: text('student_id').notNull(),
  courseId: text('course_id').notNull(),
  paymentVerified: boolean('payment_verified').notNull(),
  documentsComplete: boolean('documents_complete').notNull(),
  gradeVerified: boolean('grade_verified').notNull(),
  eligibleForCertificate: boolean('eligible_for_certificate').notNull(),
  checkedBy: text('checked_by'),
  checkedAt: timestamp('checked_at').notNull().defaultNow(),
  notes: text('notes'),
});

// Relations
export const certificateBlankBatchesRelations = relations(certificateBlankBatches, ({ many }) => ({
  blanks: many(certificateBlanks),
}));

export const certificateBlanksRelations = relations(certificateBlanks, ({ one }) => ({
  batch: one(certificateBlankBatches, { fields: [certificateBlanks.batchId], references: [certificateBlankBatches.id] }),
}));

export const registryBooksRelations = relations(registryBooks, ({ many }) => ({
  entries: many(registryBookEntries),
}));

export const registryBookEntriesRelations = relations(registryBookEntries, ({ one }) => ({
  registryBook: one(registryBooks, { fields: [registryBookEntries.registryBookId], references: [registryBooks.id] }),
  student: one(students, { fields: [registryBookEntries.studentId], references: [students.id] }),
  parentEntry: one(registryBookEntries, { fields: [registryBookEntries.parentEntryId], references: [registryBookEntries.id] }),
}));

export const certificatesRelations = relations(certificates, ({ one, many }) => ({
  registryEntry: one(registryBookEntries, { fields: [certificates.registryEntryId], references: [registryBookEntries.id] }),
  workflowSteps: many(certificateWorkflowSteps),
}));

export const certificateWorkflowStepsRelations = relations(certificateWorkflowSteps, ({ one }) => ({
  certificate: one(certificates, { fields: [certificateWorkflowSteps.certificateId], references: [certificates.id] }),
}));

// Types
export type CertificateBlankBatch = typeof certificateBlankBatches.$inferSelect;
export type CertificateBlank = typeof certificateBlanks.$inferSelect;
export type RegistryBook = typeof registryBooks.$inferSelect;
export type RegistryBookEntry = typeof registryBookEntries.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type CertificateWorkflowStep = typeof certificateWorkflowSteps.$inferSelect;
export type PreCheckRecord = typeof preCheckRecords.$inferSelect;

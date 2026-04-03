import { pgSchema, uuid, varchar, text, decimal, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Create finance schema
export const financeSchema = pgSchema('finance');

// Enums
export const feeTypeEnum = pgEnum('fee_type', [
  'tuition',
  'registration',
  'materials',
  'examination',
  'certificate',
  'late_fee',
  'other',
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'pending',
  'paid',
  'partial',
  'overdue',
  'cancelled',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'bank_transfer',
  'credit_card',
  'momo',
  'zalopay',
  'other',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded',
]);

export const refundStatusEnum = pgEnum('refund_status', [
  'pending',
  'approved',
  'processed',
  'rejected',
]);

export const scholarshipApplicationStatusEnum = pgEnum('scholarship_application_status', [
  'pending',
  'approved',
  'rejected',
]);

// 1. Fee Schedules Table
export const feeSchedules = financeSchema.table('fee_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  courseId: text('course_id'),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('VND'),
  feeType: feeTypeEnum('fee_type').notNull().default('tuition'),
  dueDate: timestamp('due_date', { withTimezone: true }),
  lateFeeAmount: decimal('late_fee_amount', { precision: 12, scale: 2 }).default('0'),
  installmentAvailable: boolean('installment_available').notNull().default(false),
  maxInstallments: integer('max_installments').default(1),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 2. Invoices Table
export const invoices = financeSchema.table('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull().unique(),
  studentId: text('student_id').notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),
  tax: decimal('tax', { precision: 12, scale: 2 }).notNull().default('0'),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  issuedAt: timestamp('issued_at', { withTimezone: true }),
  issuedBy: text('issued_by'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 3. Invoice Items Table
export const invoiceItems = financeSchema.table('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  feeScheduleId: uuid('fee_schedule_id').references(() => feeSchedules.id),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 4. Payments Table
export const payments = financeSchema.table('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  paymentNumber: varchar('payment_number', { length: 100 }).notNull().unique(),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  studentId: text('student_id').notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('VND'),
  paymentMethod: paymentMethodEnum('payment_method').notNull().default('cash'),
  transactionReference: varchar('transaction_reference', { length: 255 }),
  status: paymentStatusEnum('status').notNull().default('pending'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: text('verified_by'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 5. Refunds Table
export const refunds = financeSchema.table('refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  status: refundStatusEnum('status').notNull().default('pending'),
  requestedBy: text('requested_by').notNull(),
  approvedBy: text('approved_by'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 6. Scholarships Table
export const scholarships = financeSchema.table('scholarships', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }),
  discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }),
  code: varchar('code', { length: 100 }).unique(),
  maxUses: integer('max_uses'),
  currentUses: integer('current_uses').notNull().default(0),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validTo: timestamp('valid_to', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 7. Scholarship Applications Table
export const scholarshipApplications = financeSchema.table('scholarship_applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  scholarshipId: uuid('scholarship_id').notNull().references(() => scholarships.id),
  studentId: text('student_id').notNull(),
  status: scholarshipApplicationStatusEnum('status').notNull().default('pending'),
  appliedAt: timestamp('applied_at', { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: text('reviewed_by'),
  notes: text('notes'),
});

// Relations
export const feeSchedulesRelations = relations(feeSchedules, ({ many }) => ({
  invoiceItems: many(invoiceItems),
}));

export const invoicesRelations = relations(invoices, ({ many }) => ({
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  feeSchedule: one(feeSchedules, {
    fields: [invoiceItems.feeScheduleId],
    references: [feeSchedules.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  refunds: many(refunds),
}));

export const refundsRelations = relations(refunds, ({ one }) => ({
  payment: one(payments, {
    fields: [refunds.paymentId],
    references: [payments.id],
  }),
}));

export const scholarshipsRelations = relations(scholarships, ({ many }) => ({
  applications: many(scholarshipApplications),
}));

export const scholarshipApplicationsRelations = relations(scholarshipApplications, ({ one }) => ({
  scholarship: one(scholarships, {
    fields: [scholarshipApplications.scholarshipId],
    references: [scholarships.id],
  }),
}));

// Types
export type FeeSchedule = typeof feeSchedules.$inferSelect;
export type NewFeeSchedule = typeof feeSchedules.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type Refund = typeof refunds.$inferSelect;
export type NewRefund = typeof refunds.$inferInsert;

export type Scholarship = typeof scholarships.$inferSelect;
export type NewScholarship = typeof scholarships.$inferInsert;

export type ScholarshipApplication = typeof scholarshipApplications.$inferSelect;
export type NewScholarshipApplication = typeof scholarshipApplications.$inferInsert;

// Enum types
export type FeeType = typeof feeTypeEnum.enumValues[number];
export type InvoiceStatus = typeof invoiceStatusEnum.enumValues[number];
export type PaymentMethod = typeof paymentMethodEnum.enumValues[number];
export type PaymentStatus = typeof paymentStatusEnum.enumValues[number];
export type RefundStatus = typeof refundStatusEnum.enumValues[number];
export type ScholarshipApplicationStatus = typeof scholarshipApplicationStatusEnum.enumValues[number];

import { z } from "zod";

// ============================================
// Certificate Blank Schemas
// ============================================

export const importBatchSchema = z.object({
  batchNumber: z.string().min(1, "Batch number is required"),
  serialNumberStart: z.string().min(1, "Serial number start is required"),
  serialNumberEnd: z.string().min(1, "Serial number end is required"),
  certificateType: z.enum(["certificate", "diploma"]),
  notes: z.string().optional(),
});

export const transferBlankSchema = z.object({
  blankId: z.string().uuid(),
  transferredTo: z.string().min(1, "Transfer recipient is required"),
  notes: z.string().optional(),
});

export const cancelBlankSchema = z.object({
  reason: z.string().min(1, "Cancellation reason is required"),
  witness1: z.string().optional(),
  witness2: z.string().optional(),
});

// ============================================
// Registry Book Schemas
// ============================================

export const createBookSchema = z.object({
  bookNumber: z.string().min(1, "Book number is required"),
  year: z.number().int().min(2020).max(2100),
  storageLocation: z.string().optional(),
});

export const addEntrySchema = z.object({
  studentId: z.string().uuid(),
  fullName: z.string().min(1, "Full name is required"),
  dateOfBirth: z.string().datetime(),
  placeOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]),
  nationality: z.string().default("Vietnamese"),
  ethnicity: z.string().optional(),
  courseId: z.string().uuid(),
  courseName: z.string().min(1, "Course name is required"),
  decisionNumber: z.string().min(1, "Decision number is required"),
  decisionDate: z.string().datetime(),
  classification: z.enum(["excellent", "good", "fair", "pass"]),
  certificateSerialNumber: z.string().min(1, "Certificate serial number is required"),
  certificateNumber: z.string().optional(),
  issueDate: z.string().datetime().optional(),
});

export const correctEntrySchema = z.object({
  correctionReason: z.string().min(1, "Correction reason is required"),
  corrections: z.object({
    fullName: z.string().optional(),
    dateOfBirth: z.string().datetime().optional(),
    placeOfBirth: z.string().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    nationality: z.string().optional(),
    ethnicity: z.string().optional(),
    courseName: z.string().optional(),
    classification: z.enum(["excellent", "good", "fair", "pass"]).optional(),
  }),
});

// ============================================
// Certificate Schemas
// ============================================

export const issueCertificateSchema = z.object({
  studentId: z.string().uuid(),
  courseId: z.string().uuid(),
  certificateType: z.enum(["certificate", "diploma"]),
  decisionNumber: z.string().min(1, "Decision number is required"),
  decisionDate: z.string().datetime(),
  classification: z.enum(["excellent", "good", "fair", "pass"]),
  notes: z.string().optional(),
});

// ============================================
// Workflow Schemas
// ============================================

export const preCheckSchema = z.object({
  studentId: z.string().uuid(),
  courseId: z.string().uuid(),
  paymentVerified: z.boolean(),
  documentsComplete: z.boolean(),
  gradeVerified: z.boolean(),
  notes: z.string().optional(),
});

// ============================================
// Type Exports
// ============================================

export type ImportBatchInput = z.infer<typeof importBatchSchema>;
export type TransferBlankInput = z.infer<typeof transferBlankSchema>;
export type CancelBlankInput = z.infer<typeof cancelBlankSchema>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type AddEntryInput = z.infer<typeof addEntrySchema>;
export type CorrectEntryInput = z.infer<typeof correctEntrySchema>;
export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>;
export type PreCheckInput = z.infer<typeof preCheckSchema>;

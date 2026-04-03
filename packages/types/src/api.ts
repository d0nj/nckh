import { z } from 'zod';

// Role definitions
export const UserRoleSchema = z.enum(['admin', 'teacher', 'student']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Course status
export const CourseStatusSchema = z.enum(['draft', 'published', 'archived']);
export type CourseStatus = z.infer<typeof CourseStatusSchema>;

// Lesson types
export const LessonTypeSchema = z.enum(['video', 'text', 'quiz', 'assignment']);
export type LessonType = z.infer<typeof LessonTypeSchema>;

// Enrollment status
export const EnrollmentStatusSchema = z.enum(['active', 'completed', 'dropped']);
export type EnrollmentStatus = z.infer<typeof EnrollmentStatusSchema>;

// Submission status
export const SubmissionStatusSchema = z.enum(['submitted', 'graded', 'returned']);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

// Assignment types
export const AssignmentTypeSchema = z.enum(['quiz', 'assignment', 'exam']);
export type AssignmentType = z.infer<typeof AssignmentTypeSchema>;

// API Response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
    }).optional(),
  });

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

// Paginated response
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
  });

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Pagination params
export const PaginationParamsSchema = z.object({
  page: z.string().transform(Number).default('1'),
  pageSize: z.string().transform(Number).default('10'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

import { pgSchema, text, timestamp, integer, boolean, jsonb, real, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =============================================
// Student Schema - PostgreSQL
// Thai Binh University Training Platform
// =============================================

export const studentSchema = pgSchema('student');

// =============================================
// 1. STUDENTS TABLE
// =============================================
export const students = studentSchema.table('students', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  organizationId: text('organization_id').notNull(),
  studentId: text('student_id').notNull().unique(),
  enrollmentDate: timestamp('enrollment_date').notNull(),
  status: text('status', { enum: ['active', 'suspended', 'graduated', 'withdrawn'] })
    .notNull()
    .default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Unique constraint for studentId within an organization
  uniqueOrgStudent: uniqueIndex('unique_org_student_idx').on(table.organizationId, table.studentId),
}));

// =============================================
// 2. ENROLLMENTS TABLE
// =============================================
export const enrollments = studentSchema.table('enrollments', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull().references(() => students.id),
  courseId: text('course_id').notNull(),
  organizationId: text('organization_id').notNull(),
  status: text('status', { enum: ['pending', 'active', 'completed', 'dropped', 'failed'] })
    .notNull()
    .default('pending'),
  enrolledAt: timestamp('enrolled_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  finalGrade: real('final_grade'),
  certificateId: text('certificate_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // Unique constraint for student + course combination
  uniqueStudentCourse: uniqueIndex('unique_student_course_idx').on(table.studentId, table.courseId),
}));

// =============================================
// 3. PROGRESS TABLE
// =============================================
export const progress = studentSchema.table('progress', {
  id: text('id').primaryKey(),
  enrollmentId: text('enrollment_id').notNull().references(() => enrollments.id),
  lessonId: text('lesson_id').notNull(),
  organizationId: text('organization_id').notNull(),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at'),
  timeSpent: integer('time_spent').default(0), // in seconds
  score: real('score'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Unique constraint for enrollment + lesson combination
  uniqueEnrollmentLesson: uniqueIndex('unique_enrollment_lesson_idx').on(table.enrollmentId, table.lessonId),
}));

// =============================================
// 4. ASSIGNMENTS TABLE
// =============================================
export const assignments = studentSchema.table('assignments', {
  id: text('id').primaryKey(),
  courseId: text('course_id').notNull(),
  organizationId: text('organization_id').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: text('type', { enum: ['quiz', 'assignment', 'exam', 'project'] })
    .notNull()
    .default('assignment'),
  maxScore: real('max_score').notNull().default(100),
  passingScore: real('passing_score').notNull().default(60),
  dueDate: timestamp('due_date'),
  allowLateSubmission: boolean('allow_late_submission').notNull().default(false),
  latePenalty: real('late_penalty').default(0), // percentage deduction
  attachments: jsonb('attachments'), // JSON array of attachment objects
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================
// 5. SUBMISSIONS TABLE
// =============================================
export const submissions = studentSchema.table('submissions', {
  id: text('id').primaryKey(),
  assignmentId: text('assignment_id').notNull().references(() => assignments.id),
  studentId: text('student_id').notNull().references(() => students.id),
  organizationId: text('organization_id').notNull(),
  content: text('content'),
  attachments: jsonb('attachments'), // JSON array of attachment objects
  score: real('score'),
  feedback: text('feedback'),
  status: text('status', { enum: ['draft', 'submitted', 'grading', 'graded', 'returned'] })
    .notNull()
    .default('draft'),
  submittedAt: timestamp('submitted_at'),
  gradedAt: timestamp('graded_at'),
  gradedBy: text('graded_by'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================
// 6. APPLICATIONS TABLE
// =============================================
export const applications = studentSchema.table('applications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  courseId: text('course_id').notNull(),
  organizationId: text('organization_id').notNull(),
  status: text('status', { enum: ['draft', 'submitted', 'under_review', 'accepted', 'rejected', 'waitlisted'] })
    .notNull()
    .default('draft'),
  formData: jsonb('form_data'), // JSON object containing application form data
  documents: jsonb('documents'), // JSON array of uploaded document references
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: text('reviewed_by'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// =============================================
// RELATIONS
// =============================================

// Students Relations
export const studentsRelations = relations(students, ({ many }) => ({
  enrollments: many(enrollments),
  submissions: many(submissions),
}));

// Enrollments Relations
export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  student: one(students, { fields: [enrollments.studentId], references: [students.id] }),
  progress: many(progress),
}));

// Progress Relations
export const progressRelations = relations(progress, ({ one }) => ({
  enrollment: one(enrollments, { fields: [progress.enrollmentId], references: [enrollments.id] }),
}));

// Assignments Relations
export const assignmentsRelations = relations(assignments, ({ many }) => ({
  submissions: many(submissions),
}));

// Submissions Relations
export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, { fields: [submissions.assignmentId], references: [assignments.id] }),
  student: one(students, { fields: [submissions.studentId], references: [students.id] }),
}));

// =============================================
// TYPE EXPORTS
// =============================================

// Students Types
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;

// Enrollments Types
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;

// Progress Types
export type Progress = typeof progress.$inferSelect;
export type NewProgress = typeof progress.$inferInsert;

// Assignments Types
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;

// Submissions Types
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;

// Applications Types
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

// Enum Types
export type StudentStatus = 'active' | 'suspended' | 'graduated' | 'withdrawn';
export type EnrollmentStatus = 'pending' | 'active' | 'completed' | 'dropped' | 'failed';
export type AssignmentType = 'quiz' | 'assignment' | 'exam' | 'project';
export type SubmissionStatus = 'draft' | 'submitted' | 'grading' | 'graded' | 'returned';
export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'waitlisted';

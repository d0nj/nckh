import { pgTable, text, integer, timestamp, boolean, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user';
import { courses, lessons } from './course';

// Student enrollments in courses
export const enrollments = pgTable('enrollments', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  courseId: text('course_id').notNull().references(() => courses.id),
  status: text('status', { enum: ['active', 'completed', 'dropped'] }).notNull().default('active'),
  enrolledAt: timestamp('enrolled_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Progress tracking per lesson
export const progress = pgTable('progress', {
  id: text('id').primaryKey(),
  enrollmentId: text('enrollment_id').notNull().references(() => enrollments.id),
  lessonId: text('lesson_id').notNull().references(() => lessons.id),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at'),
  timeSpent: integer('time_spent').default(0), // in seconds
});

// Assignments/Quizzes
export const assignments = pgTable('assignments', {
  id: text('id').primaryKey(),
  courseId: text('course_id').notNull().references(() => courses.id),
  lessonId: text('lesson_id').references(() => lessons.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  dueDate: timestamp('due_date'),
  maxScore: integer('max_score').notNull().default(100),
  type: text('type', { enum: ['quiz', 'assignment', 'exam'] }).notNull().default('assignment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Student submissions
export const submissions = pgTable('submissions', {
  id: text('id').primaryKey(),
  assignmentId: text('assignment_id').notNull().references(() => assignments.id),
  userId: text('user_id').notNull().references(() => users.id),
  content: text('content'),
  attachments: text('attachments'), // JSON string
  score: integer('score'),
  feedback: text('feedback'),
  status: text('status', { enum: ['submitted', 'graded', 'returned'] }).notNull().default('submitted'),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  gradedAt: timestamp('graded_at'),
});

// Final grades for courses
export const grades = pgTable('grades', {
  id: text('id').primaryKey(),
  enrollmentId: text('enrollment_id').notNull().references(() => enrollments.id),
  courseId: text('course_id').notNull().references(() => courses.id),
  userId: text('user_id').notNull().references(() => users.id),
  totalScore: real('total_score').notNull().default(0),
  letterGrade: text('letter_grade'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Relations
export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
  progress: many(progress),
  grades: many(grades),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  enrollment: one(enrollments, { fields: [progress.enrollmentId], references: [enrollments.id] }),
  lesson: one(lessons, { fields: [progress.lessonId], references: [lessons.id] }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  course: one(courses, { fields: [assignments.courseId], references: [courses.id] }),
  lesson: one(lessons, { fields: [assignments.lessonId], references: [lessons.id] }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  assignment: one(assignments, { fields: [submissions.assignmentId], references: [assignments.id] }),
  user: one(users, { fields: [submissions.userId], references: [users.id] }),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  enrollment: one(enrollments, { fields: [grades.enrollmentId], references: [enrollments.id] }),
  course: one(courses, { fields: [grades.courseId], references: [courses.id] }),
  user: one(users, { fields: [grades.userId], references: [users.id] }),
}));

// Types
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
export type Progress = typeof progress.$inferSelect;
export type NewProgress = typeof progress.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type Grade = typeof grades.$inferSelect;
export type NewGrade = typeof grades.$inferInsert;
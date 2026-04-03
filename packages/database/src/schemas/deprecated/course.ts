import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user';

// Courses table
export const courses = pgTable('courses', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  code: text('code').notNull().unique(),
  teacherId: text('teacher_id').notNull().references(() => users.id),
  status: text('status', { enum: ['draft', 'published', 'archived'] }).notNull().default('draft'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  maxStudents: integer('max_students'),
  price: integer('price').notNull().default(0),
  thumbnail: text('thumbnail'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Course modules
export const modules = pgTable('modules', {
  id: text('id').primaryKey(),
  courseId: text('course_id').notNull().references(() => courses.id),
  title: text('title').notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Lessons within modules
export const lessons = pgTable('lessons', {
  id: text('id').primaryKey(),
  moduleId: text('module_id').notNull().references(() => modules.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  type: text('type', { enum: ['video', 'text', 'quiz', 'assignment'] }).notNull(),
  order: integer('order').notNull(),
  duration: integer('duration'), // in minutes
  videoUrl: text('video_url'),
  attachments: text('attachments'), // JSON string of attachments
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const coursesRelations = relations(courses, ({ one, many }) => ({
  teacher: one(users, { fields: [courses.teacherId], references: [users.id] }),
  modules: many(modules),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, { fields: [modules.courseId], references: [courses.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  module: one(modules, { fields: [lessons.moduleId], references: [modules.id] }),
}));

// Types
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
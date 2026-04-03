import {
  pgSchema,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define the academic schema
export const academicSchema = pgSchema('academic');

// Import types from auth schema (we'll reference by UUID)
// Note: auth.users and auth.organizations are defined in auth.ts

// Enums
export const departmentTypeEnum = pgEnum('department_type', [
  'faculty',
  'center',
  'department',
]);

export const courseStatusEnum = pgEnum('course_status', [
  'draft',
  'published',
  'archived',
]);

export const admissionModeEnum = pgEnum('admission_mode', [
  'fixed',
  'rolling',
]);

export const lessonTypeEnum = pgEnum('lesson_type', [
  'video',
  'text',
  'quiz',
  'assignment',
  'live',
]);

export const teacherRoleEnum = pgEnum('teacher_role', [
  'primary',
  'assistant',
  'guest',
]);

export const waitlistStatusEnum = pgEnum('waitlist_status', [
  'waiting',
  'offered',
  'enrolled',
  'cancelled',
]);

// Categories table
export const categories = academicSchema.table(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    parentId: uuid('parent_id').references((): any => categories.id),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('categories_slug_idx').on(table.slug),
    index('categories_parent_id_idx').on(table.parentId),
  ]
);

// Departments table
export const departments = academicSchema.table(
  'departments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    type: departmentTypeEnum('type').notNull(),
    hodId: uuid('hod_id'),
    contactEmail: varchar('contact_email', { length: 255 }),
    contactPhone: varchar('contact_phone', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('departments_org_code_idx').on(table.organizationId, table.code),
    index('departments_organization_id_idx').on(table.organizationId),
    index('departments_type_idx').on(table.type),
  ]
);

// Courses table
export const courses = academicSchema.table(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id').notNull(),
    categoryId: uuid('category_id').references(() => categories.id),
    code: varchar('code', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    thumbnail: varchar('thumbnail', { length: 500 }),
    status: courseStatusEnum('status').notNull().default('draft'),
    admissionMode: admissionModeEnum('admission_mode').notNull().default('fixed'),
    minStudents: integer('min_students'),
    maxStudents: integer('max_students'),
    waitlistThreshold: integer('waitlist_threshold'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull().default('0'),
    currency: varchar('currency', { length: 3 }).notNull().default('VND'),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    enrollmentDeadline: timestamp('enrollment_deadline', { withTimezone: true }),
    requirements: text('requirements'),
    learningOutcomes: text('learning_outcomes'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('courses_org_code_idx').on(table.organizationId, table.code),
    index('courses_organization_id_idx').on(table.organizationId),
    index('courses_category_id_idx').on(table.categoryId),
    index('courses_status_idx').on(table.status),
    index('courses_created_by_idx').on(table.createdBy),
  ]
);

// Modules table
export const modules = academicSchema.table(
  'modules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    order: integer('order').notNull(),
    duration: integer('duration'), // in minutes
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('modules_course_id_idx').on(table.courseId),
    index('modules_order_idx').on(table.order),
  ]
);

// Lessons table
export const lessons = academicSchema.table(
  'lessons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    moduleId: uuid('module_id')
      .notNull()
      .references(() => modules.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content'),
    type: lessonTypeEnum('type').notNull(),
    order: integer('order').notNull(),
    duration: integer('duration'), // in minutes
    videoUrl: varchar('video_url', { length: 500 }),
    attachments: jsonb('attachments'), // Array of attachment objects
    isPreview: integer('is_preview', { mode: 'boolean' }).notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('lessons_module_id_idx').on(table.moduleId),
    index('lessons_type_idx').on(table.type),
    index('lessons_order_idx').on(table.order),
  ]
);

// Teachers table
export const teachers = academicSchema.table(
  'teachers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    organizationId: uuid('organization_id').notNull(),
    bio: text('bio'),
    qualifications: jsonb('qualifications'), // Array of qualification objects
    specializations: jsonb('specializations'), // Array of specialization strings
    rating: decimal('rating', { precision: 3, scale: 2 }),
    totalStudents: integer('total_students').notNull().default(0),
    totalCourses: integer('total_courses').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('teachers_user_org_idx').on(table.userId, table.organizationId),
    index('teachers_user_id_idx').on(table.userId),
    index('teachers_organization_id_idx').on(table.organizationId),
  ]
);

// Course assignments table
export const courseAssignments = academicSchema.table(
  'course_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    teacherId: uuid('teacher_id')
      .notNull()
      .references(() => teachers.id, { onDelete: 'cascade' }),
    role: teacherRoleEnum('role').notNull().default('assistant'),
    assignedAt: timestamp('assigned_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('course_assignments_course_teacher_idx').on(table.courseId, table.teacherId),
    index('course_assignments_course_id_idx').on(table.courseId),
    index('course_assignments_teacher_id_idx').on(table.teacherId),
  ]
);

// Waitlist table
export const waitlist = academicSchema.table(
  'waitlist',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    position: integer('position').notNull(),
    status: waitlistStatusEnum('status').notNull().default('waiting'),
    offeredAt: timestamp('offered_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('waitlist_course_user_idx').on(table.courseId, table.userId),
    index('waitlist_course_id_idx').on(table.courseId),
    index('waitlist_user_id_idx').on(table.userId),
    index('waitlist_status_idx').on(table.status),
  ]
);

// Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
  courses: many(courses),
}));

export const departmentsRelations = relations(departments, ({ one }) => ({
  // Note: hodId references auth.users which is in a different schema
  // This would need to be handled at the application level or via a view
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  category: one(categories, {
    fields: [courses.categoryId],
    references: [categories.id],
  }),
  modules: many(modules),
  assignments: many(courseAssignments),
  waitlist: many(waitlist),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, {
    fields: [modules.courseId],
    references: [courses.id],
  }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
}));

export const teachersRelations = relations(teachers, ({ many }) => ({
  assignments: many(courseAssignments),
}));

export const courseAssignmentsRelations = relations(courseAssignments, ({ one }) => ({
  course: one(courses, {
    fields: [courseAssignments.courseId],
    references: [courses.id],
  }),
  teacher: one(teachers, {
    fields: [courseAssignments.teacherId],
    references: [teachers.id],
  }),
}));

export const waitlistRelations = relations(waitlist, ({ one }) => ({
  course: one(courses, {
    fields: [waitlist.courseId],
    references: [courses.id],
  }),
}));

// Types
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Module = typeof modules.$inferSelect;
export type NewModule = typeof modules.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type NewLesson = typeof lessons.$inferInsert;
export type Teacher = typeof teachers.$inferSelect;
export type NewTeacher = typeof teachers.$inferInsert;
export type CourseAssignment = typeof courseAssignments.$inferSelect;
export type NewCourseAssignment = typeof courseAssignments.$inferInsert;
export type Waitlist = typeof waitlist.$inferSelect;
export type NewWaitlist = typeof waitlist.$inferInsert;

// Enum types
export type DepartmentType = (typeof departmentTypeEnum.enumValues)[number];
export type CourseStatus = (typeof courseStatusEnum.enumValues)[number];
export type AdmissionMode = (typeof admissionModeEnum.enumValues)[number];
export type LessonType = (typeof lessonTypeEnum.enumValues)[number];
export type TeacherRole = (typeof teacherRoleEnum.enumValues)[number];
export type WaitlistStatus = (typeof waitlistStatusEnum.enumValues)[number];

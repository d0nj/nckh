import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// =============================================
// BETTER AUTH CORE TABLES
// =============================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  role: text("role").default("student"),
  banned: boolean("banned").default(false),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires"),
  // Extended profile fields
  phone: text("phone"),
  gender: text("gender"),
  dateOfBirth: text("dateOfBirth"),
  address: text("address"),
  idNumber: text("idNumber"), // CCCD/CMND
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonatedBy"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

// =============================================
// MODULE 2: QUẢN LÝ ĐÀO TẠO
// =============================================

export const programs = pgTable("programs", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type")
    .notNull()
    .default("short_term"),
  durationHours: integer("duration_hours").notNull(),
  totalCredits: integer("total_credits"),
  tuitionFee: integer("tuition_fee").notNull().default(0),
  status: text("status")
    .notNull()
    .default("draft"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  programId: text("program_id")
    .notNull()
    .references(() => programs.id, { onDelete: "cascade" }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  credits: integer("credits").notNull().default(0),
  hours: integer("hours").notNull().default(0),
  order: integer("sort_order").notNull().default(0),
  status: text("status")
    .notNull()
    .default("active"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const classes = pgTable("classes", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  lecturerId: text("lecturer_id").references(() => user.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  maxStudents: integer("max_students").notNull().default(40),
  currentStudents: integer("current_students").notNull().default(0),
  room: text("room"),
  schedule: text("schedule"), // JSON string
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  status: text("status")
    .notNull()
    .default("open"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// =============================================
// MODULE 3: TUYỂN SINH VÀ QUẢN LÝ SINH VIÊN
// =============================================

export const enrollments = pgTable("enrollments", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  classId: text("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  status: text("status")
    .notNull()
    .default("pending"),
  enrolledAt: text("enrolled_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  completedAt: text("completed_at"),
  waitlistPosition: integer("waitlist_position"),
  note: text("note"),
});

export const studentProfiles = pgTable("student_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  studentCode: text("student_code").notNull().unique(),
  enrollmentDate: text("enrollment_date").notNull(),
  programId: text("program_id").references(() => programs.id),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  notes: text("notes"),
});

// =============================================
// MODULE 4: QUẢN LÝ THI VÀ ĐIỂM
// =============================================

export const exams = pgTable("exams", {
  id: text("id").primaryKey(),
  classId: text("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type")
    .notNull()
    .default("final"),
  examDate: text("exam_date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  room: text("room"),
  duration: integer("duration"),
  maxScore: real("max_score").notNull().default(10),
  weight: real("weight").notNull().default(1),
  status: text("status")
    .notNull()
    .default("scheduled"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const grades = pgTable("grades", {
  id: text("id").primaryKey(),
  examId: text("exam_id")
    .notNull()
    .references(() => exams.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  score: real("score"),
  letterGrade: text("letter_grade"),
  status: text("status")
    .notNull()
    .default("pending"),
  gradedBy: text("graded_by").references(() => user.id),
  gradedAt: text("graded_at"),
  note: text("note"),
});

export const gradeAppeals = pgTable("grade_appeals", {
  id: text("id").primaryKey(),
  gradeId: text("grade_id")
    .notNull()
    .references(() => grades.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id),
  reason: text("reason").notNull(),
  status: text("status")
    .notNull()
    .default("pending"),
  resolvedBy: text("resolved_by").references(() => user.id),
  resolution: text("resolution"),
  newScore: real("new_score"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  resolvedAt: text("resolved_at"),
});

export const examBank = pgTable("exam_bank", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  type: text("type")
    .notNull()
    .default("mixed"),
  difficulty: text("difficulty")
    .notNull()
    .default("medium"),
  createdBy: text("created_by").references(() => user.id),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// =============================================
// MODULE 5: QUẢN LÝ CẤP BẰNG VÀ CHỨNG CHỈ
// =============================================

export const certificates = pgTable("certificates", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  programId: text("program_id")
    .notNull()
    .references(() => programs.id),
  certificateNumber: text("certificate_number").notNull().unique(),
  registryNumber: text("registry_number").notNull(),
  type: text("type").notNull(),
  issueDate: text("issue_date").notNull(),
  classification: text("classification"),
  gpa: real("gpa"),
  status: text("status")
    .notNull()
    .default("pending"),
  approvedBy: text("approved_by").references(() => user.id),
  approvedAt: text("approved_at"),
  issuedBy: text("issued_by").references(() => user.id),
  issuedAt: text("issued_at"),
  revokedReason: text("revoked_reason"),
  templateId: text("template_id"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const certificateTemplates = pgTable("certificate_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  content: text("content"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const blankCertificates = pgTable("blank_certificates", {
  id: text("id").primaryKey(),
  batchNumber: text("batch_number").notNull(),
  serialStart: text("serial_start").notNull(),
  serialEnd: text("serial_end").notNull(),
  quantity: integer("quantity").notNull(),
  usedQuantity: integer("used_quantity").notNull().default(0),
  destroyedQuantity: integer("destroyed_quantity").notNull().default(0),
  receivedDate: text("received_date").notNull(),
  receivedBy: text("received_by").references(() => user.id),
  status: text("status")
    .notNull()
    .default("available"),
  destroyReport: text("destroy_report"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// =============================================
// MODULE 6: TÀI CHÍNH VÀ KẾ TOÁN
// =============================================

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  enrollmentId: text("enrollment_id").references(() => enrollments.id),
  debtId: text("debt_id").references(() => debts.id),
  amount: integer("amount").notNull(),
  type: text("type")
    .notNull()
    .default("tuition"),
  method: text("method")
    .notNull()
    .default("cash"),
  status: text("status")
    .notNull()
    .default("pending"),
  transactionId: text("transaction_id").unique(),
  invoiceNumber: text("invoice_number"),
  description: text("description"),
  paidAt: text("paid_at"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  paymentId: text("payment_id").references(() => payments.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id),
  amount: integer("amount").notNull(),
  tax: integer("tax").notNull().default(0),
  totalAmount: integer("total_amount").notNull(),
  status: text("status")
    .notNull()
    .default("draft"),
  issuedAt: text("issued_at"),
  dueDate: text("due_date"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const debts = pgTable("debts", {
  id: text("id").primaryKey(),
  studentId: text("student_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  remainingAmount: integer("remaining_amount").notNull(),
  reason: text("reason").notNull(),
  dueDate: text("due_date"),
  status: text("status")
    .notNull()
    .default("active"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// =============================================
// MODULE 8: THÔNG BÁO
// =============================================

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type")
    .notNull()
    .default("info"),
  isRead: boolean("is_read").notNull().default(false),
  link: text("link"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// =============================================
// RELATIONS
// =============================================

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  enrollments: many(enrollments),
  grades: many(grades),
  payments: many(payments),
  notifications: many(notifications),
  studentProfile: one(studentProfiles, {
    fields: [user.id],
    references: [studentProfiles.userId],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const programsRelations = relations(programs, ({ many }) => ({
  courses: many(courses),
  certificates: many(certificates),
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  program: one(programs, {
    fields: [courses.programId],
    references: [programs.id],
  }),
  classes: many(classes),
  examBank: many(examBank),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  course: one(courses, {
    fields: [classes.courseId],
    references: [courses.id],
  }),
  lecturer: one(user, { fields: [classes.lecturerId], references: [user.id] }),
  enrollments: many(enrollments),
  exams: many(exams),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(user, {
    fields: [enrollments.studentId],
    references: [user.id],
  }),
  class: one(classes, {
    fields: [enrollments.classId],
    references: [classes.id],
  }),
}));

export const examsRelations = relations(exams, ({ one, many }) => ({
  class: one(classes, { fields: [exams.classId], references: [classes.id] }),
  grades: many(grades),
}));

export const gradesRelations = relations(grades, ({ one }) => ({
  exam: one(exams, { fields: [grades.examId], references: [exams.id] }),
  student: one(user, { fields: [grades.studentId], references: [user.id] }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  student: one(user, {
    fields: [certificates.studentId],
    references: [user.id],
  }),
  program: one(programs, {
    fields: [certificates.programId],
    references: [programs.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(user, { fields: [payments.studentId], references: [user.id] }),
  enrollment: one(enrollments, {
    fields: [payments.enrollmentId],
    references: [enrollments.id],
  }),
  debt: one(debts, {
    fields: [payments.debtId],
    references: [debts.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),
}));

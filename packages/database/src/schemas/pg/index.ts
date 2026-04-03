// ============================================
// PostgreSQL Schema Index - Explicit Exports
// Thai Binh University Training Platform
// ============================================

// Auth Schema (User Service domain)
export {
  // Tables
  users,
  sessions,
  accounts,
  organizations,
  members,
  invitations,
  verifications,
  profiles,
  jwks,
  organizationRoles,
  // Relations
  usersRelations,
  organizationsRelations,
  membersRelations,
  invitationsRelations,
  sessionsRelations,
  accountsRelations,
  profilesRelations,
  jwksRelations,
  organizationRolesRelations,
  // Enums
  memberRoleEnum,
  invitationStatusEnum,
  genderEnum,
  // Types
  type User,
  type NewUser,
  type Organization,
  type NewOrganization,
  type Member,
  type NewMember,
  type Invitation,
  type NewInvitation,
  type Session,
  type NewSession,
  type Account,
  type NewAccount,
  type Verification,
  type NewVerification,
  type Profile,
  type NewProfile,
  type Jwks,
  type NewJwks,
  type OrganizationRole,
  type NewOrganizationRole,
  type MemberRole,
  type InvitationStatus,
  type Gender,
} from './auth';

// Academic Schema (Course Service domain)
export {
  // Tables
  categories,
  departments,
  courses,
  modules,
  lessons,
  teachers,
  courseAssignments,
  waitlist,
  // Relations
  categoriesRelations,
  departmentsRelations,
  coursesRelations,
  modulesRelations,
  lessonsRelations,
  teachersRelations,
  courseAssignmentsRelations,
  waitlistRelations,
  // Enums
  departmentTypeEnum,
  courseStatusEnum,
  admissionModeEnum,
  lessonTypeEnum,
  teacherRoleEnum,
  waitlistStatusEnum,
  // Types
  type Category,
  type NewCategory,
  type Department,
  type NewDepartment,
  type Course,
  type NewCourse,
  type Module,
  type NewModule,
  type Lesson,
  type NewLesson,
  type Teacher,
  type NewTeacher,
  type CourseAssignment,
  type NewCourseAssignment,
  type Waitlist,
  type NewWaitlist,
  type DepartmentType,
  type CourseStatus,
  type AdmissionMode,
  type LessonType,
  type TeacherRole,
  type WaitlistStatus,
} from './academic';

// Student Schema (Enrollment Service domain)
export {
  // Tables
  students,
  enrollments,
  progress,
  assignments,
  submissions,
  applications,
  // Relations
  studentsRelations,
  enrollmentsRelations,
  progressRelations,
  assignmentsRelations,
  submissionsRelations,
  // Types
  type Student,
  type NewStudent,
  type Enrollment,
  type NewEnrollment,
  type Progress,
  type NewProgress,
  type Assignment,
  type NewAssignment,
  type Submission,
  type NewSubmission,
  type Application,
  type NewApplication,
  type StudentStatus,
  type EnrollmentStatus,
  type AssignmentType,
  type SubmissionStatus,
  type ApplicationStatus,
} from './student';

// Certification Schema (Certification Service domain)
export {
  // Tables
  certificateBlankBatches,
  certificateBlanks,
  registryBooks,
  registryBookEntries,
  certificates,
  certificateWorkflowSteps,
  preCheckRecords,
  // Relations
  certificateBlankBatchesRelations,
  certificateBlanksRelations,
  registryBooksRelations,
  registryBookEntriesRelations,
  certificatesRelations,
  certificateWorkflowStepsRelations,
  // Types
  type CertificateBlankBatch,
  type CertificateBlank,
  type RegistryBook,
  type RegistryBookEntry,
  type Certificate,
  type CertificateWorkflowStep,
  type PreCheckRecord,
} from './certification';

// Finance Schema (Finance Service domain)
export {
  // Tables
  feeSchedules,
  invoices,
  invoiceItems,
  payments,
  refunds,
  scholarships,
  scholarshipApplications,
  // Relations
  feeSchedulesRelations,
  invoicesRelations,
  invoiceItemsRelations,
  paymentsRelations,
  refundsRelations,
  scholarshipsRelations,
  scholarshipApplicationsRelations,
  // Enums
  feeTypeEnum,
  invoiceStatusEnum,
  paymentMethodEnum,
  paymentStatusEnum,
  refundStatusEnum,
  scholarshipApplicationStatusEnum,
  // Types
  type FeeSchedule,
  type NewFeeSchedule,
  type Invoice,
  type NewInvoice,
  type InvoiceItem,
  type NewInvoiceItem,
  type Payment,
  type NewPayment,
  type Refund,
  type NewRefund,
  type Scholarship,
  type NewScholarship,
  type ScholarshipApplication,
  type NewScholarshipApplication,
  type FeeType,
  type InvoiceStatus,
  type PaymentMethod,
  type PaymentStatus,
  type RefundStatus,
  type ScholarshipApplicationStatus,
} from './finance';

// Schema object for drizzle
export { authSchema } from './auth';
export { academicSchema } from './academic';
export { studentSchema } from './student';
export { certificationSchema } from './certification';
export { financeSchema } from './finance';

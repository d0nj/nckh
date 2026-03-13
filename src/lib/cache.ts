import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import {
  user,
  programs,
  classes,
  payments,
  enrollments,
  courses,
  exams,
  grades,
  certificates,
  debts,
  notifications,
  studentProfiles,
} from "@/db/schema";
import { eq, desc, sql, and, like, or } from "drizzle-orm";

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  "use cache";
  cacheLife("minutes");
  cacheTag("dashboard", "students", "programs", "classes", "payments");

  const [
    totalStudentsResult,
    totalProgramsResult,
    activeClassesResult,
    pendingPaymentsResult,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .where(eq(user.role, "student")),
    db.select({ count: sql<number>`count(*)` }).from(programs),
    db
      .select({ count: sql<number>`count(*)` })
      .from(classes)
      .where(eq(classes.status, "in_progress")),
    db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(eq(payments.status, "pending")),
  ]);

  return {
    totalStudents: totalStudentsResult[0]?.count || 0,
    totalPrograms: totalProgramsResult[0]?.count || 0,
    activeClasses: activeClassesResult[0]?.count || 0,
    pendingPayments: pendingPaymentsResult[0]?.count || 0,
  };
}

export async function getRecentEnrollments() {
  "use cache";
  cacheLife("minutes");
  cacheTag("dashboard", "enrollments");

  return db
    .select({
      id: enrollments.id,
      studentName: user.name,
      className: classes.name,
      date: enrollments.enrolledAt,
      status: enrollments.status,
    })
    .from(enrollments)
    .leftJoin(user, eq(enrollments.studentId, user.id))
    .leftJoin(classes, eq(enrollments.classId, classes.id))
    .orderBy(desc(enrollments.enrolledAt))
    .limit(5);
}

export async function getRecentPayments() {
  "use cache";
  cacheLife("minutes");
  cacheTag("dashboard", "payments");

  return db
    .select({
      id: payments.id,
      studentName: user.name,
      amount: payments.amount,
      status: payments.status,
      date: payments.createdAt,
    })
    .from(payments)
    .leftJoin(user, eq(payments.studentId, user.id))
    .orderBy(desc(payments.createdAt))
    .limit(5);
}

// ─── Courses & Classes ────────────────────────────────────────────────────────

export async function getCoursesList() {
  "use cache";
  cacheLife("hours");
  cacheTag("courses");

  return db
    .select({
      id: courses.id,
      code: courses.code,
      name: courses.name,
      credits: courses.credits,
      hours: courses.hours,
      programName: programs.name,
    })
    .from(courses)
    .leftJoin(programs, eq(courses.programId, programs.id))
    .orderBy(desc(courses.createdAt));
}

export async function getClassesList() {
  "use cache";
  cacheLife("minutes");
  cacheTag("classes");

  return db
    .select({
      id: classes.id,
      code: classes.code,
      name: classes.name,
      room: classes.room,
      currentStudents: classes.currentStudents,
      maxStudents: classes.maxStudents,
      startDate: classes.startDate,
      endDate: classes.endDate,
      status: classes.status,
      lecturerName: user.name,
    })
    .from(classes)
    .leftJoin(user, eq(classes.lecturerId, user.id))
    .orderBy(desc(classes.createdAt));
}

// ─── Students ─────────────────────────────────────────────────────────────────

export async function getStudentsList(q: string, limit: number, offset: number) {
  "use cache";
  cacheLife("minutes");
  cacheTag("students");

  let baseConditions = [eq(user.role, "student")] as any[];

  if (q) {
    baseConditions.push(
      or(
        like(user.name, `%${q}%`),
        like(user.email, `%${q}%`),
        like(studentProfiles.studentCode, `%${q}%`)
      )!
    );
  }

  return db
    .select({
      id: user.id,
      studentCode: studentProfiles.studentCode,
      name: user.name,
      email: user.email,
      phone: user.phone,
      enrollmentDate: studentProfiles.enrollmentDate,
      role: user.role,
    })
    .from(user)
    .leftJoin(studentProfiles, eq(user.id, studentProfiles.userId))
    .where(and(...baseConditions))
    .limit(limit)
    .offset(offset);
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export async function getProgramsList() {
  "use cache";
  cacheLife("hours");
  cacheTag("programs");

  return db
    .select({
      id: programs.id,
      code: programs.code,
      name: programs.name,
      type: programs.type,
      duration: programs.durationHours,
      credits: programs.totalCredits,
      tuitionFee: programs.tuitionFee,
      status: programs.status,
      courseCount: sql<number>`count(${courses.id})`,
    })
    .from(programs)
    .leftJoin(courses, eq(programs.id, courses.programId))
    .groupBy(programs.id);
}

// ─── Exams & Grades ───────────────────────────────────────────────────────────

export async function getExamsList() {
  "use cache";
  cacheLife("minutes");
  cacheTag("exams");

  return db
    .select({
      id: exams.id,
      name: exams.name,
      type: exams.type,
      date: exams.examDate,
      room: exams.room,
      duration: exams.duration,
      status: exams.status,
      className: classes.name,
    })
    .from(exams)
    .leftJoin(classes, eq(exams.classId, classes.id))
    .orderBy(desc(exams.examDate));
}

export async function getGradesList() {
  "use cache";
  cacheLife("minutes");
  cacheTag("grades");

  return db
    .select({
      id: grades.id,
      score: grades.score,
      classification: grades.letterGrade,
      status: grades.status,
      examName: exams.name,
      studentName: user.name,
    })
    .from(grades)
    .leftJoin(exams, eq(grades.examId, exams.id))
    .leftJoin(user, eq(grades.studentId, user.id))
    .orderBy(desc(grades.gradedAt));
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export async function getPaymentsList() {
  "use cache";
  cacheLife("minutes");
  cacheTag("payments");

  return db
    .select({
      id: payments.id,
      amount: payments.amount,
      type: payments.type,
      method: payments.method,
      status: payments.status,
      paymentDate: payments.paidAt,
      studentName: user.name,
    })
    .from(payments)
    .leftJoin(user, eq(payments.studentId, user.id))
    .orderBy(desc(payments.createdAt));
}

export async function getDebtsList() {
  "use cache";
  cacheLife("minutes");
  cacheTag("debts");

  return db
    .select({
      id: debts.id,
      amount: debts.amount,
      remaining: debts.remainingAmount,
      reason: debts.reason,
      dueDate: debts.dueDate,
      status: debts.status,
      studentName: user.name,
    })
    .from(debts)
    .leftJoin(user, eq(debts.studentId, user.id))
    .orderBy(desc(debts.createdAt));
}

// ─── Certificates ─────────────────────────────────────────────────────────────

export async function getCertificatesList() {
  "use cache";
  cacheLife("minutes");
  cacheTag("certificates");

  return db
    .select({
      id: certificates.id,
      certificateNumber: certificates.certificateNumber,
      registryNumber: certificates.registryNumber,
      type: certificates.type,
      issueDate: certificates.issueDate,
      classification: certificates.classification,
      gpa: certificates.gpa,
      status: certificates.status,
      studentName: user.name,
      programName: programs.name,
    })
    .from(certificates)
    .leftJoin(user, eq(certificates.studentId, user.id))
    .leftJoin(programs, eq(certificates.programId, programs.id))
    .orderBy(desc(certificates.createdAt));
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function getReportStats() {
  "use cache";
  cacheLife("minutes");
  cacheTag("reports", "students", "payments", "certificates", "enrollments");

  const [studentsResult, revenueResult, certsResult, enrollmentsResult] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(user)
        .where(eq(user.role, "student")),
      db
        .select({ total: sql<number>`sum(${payments.amount})` })
        .from(payments)
        .where(eq(payments.status, "completed")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(certificates)
        .where(eq(certificates.status, "issued")),
      db
        .select({
          total: sql<number>`count(*)`,
          completed: sql<number>`sum(case when ${enrollments.status} = 'completed' then 1 else 0 end)`,
        })
        .from(enrollments),
    ]);

  const totalStudents = studentsResult[0]?.count || 0;
  const totalRevenue = revenueResult[0]?.total || 0;
  const totalCerts = certsResult[0]?.count || 0;
  const totalEnrolls = enrollmentsResult[0]?.total || 0;
  const completedEnrolls = enrollmentsResult[0]?.completed || 0;
  const completionRate =
    totalEnrolls > 0
      ? Math.round((completedEnrolls / totalEnrolls) * 100)
      : 0;

  return {
    totalStudents,
    totalRevenue,
    totalCerts,
    totalEnrolls,
    completionRate,
  };
}

export async function getProgramStats() {
  "use cache";
  cacheLife("minutes");
  cacheTag("reports", "programs");

  return db
    .select({
      id: programs.id,
      name: programs.name,
      studentCount: sql<number>`count(distinct ${enrollments.studentId})`,
      revenue: sql<number>`sum(case when ${payments.status} = 'completed' then ${payments.amount} else 0 end)`,
    })
    .from(programs)
    .leftJoin(courses, eq(programs.id, courses.programId))
    .leftJoin(classes, eq(courses.id, classes.courseId))
    .leftJoin(enrollments, eq(classes.id, enrollments.classId))
    .leftJoin(payments, eq(enrollments.studentId, payments.studentId))
    .groupBy(programs.id, programs.name);
}

export async function getRecentCompletedPayments() {
  "use cache";
  cacheLife("minutes");
  cacheTag("reports", "payments");

  return db
    .select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      paidAt: payments.paidAt,
      studentName: user.name,
    })
    .from(payments)
    .leftJoin(user, eq(payments.studentId, user.id))
    .where(eq(payments.status, "completed"))
    .orderBy(desc(payments.paidAt))
    .limit(10);
}

// ─── Portal: Student-specific (cached by userId) ─────────────────────────────

export async function getStudentProfile(userId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("student-profile", `student-${userId}`);

  const [profile] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, userId))
    .limit(1);

  return profile || null;
}

export async function getStudentDashboardData(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(
    "student-dashboard",
    `student-${userId}`,
    "enrollments",
    "grades",
    "debts",
    "notifications"
  );

  const [
    [enrolledCountResult],
    [avgGradeResult],
    [debtResult],
    [notificationResult],
    recentGrades,
    upcomingClasses,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.studentId, userId),
          eq(enrollments.status, "enrolled")
        )
      ),
    db
      .select({ avg: sql<number>`avg(${grades.score})` })
      .from(grades)
      .where(
        and(
          eq(grades.studentId, userId),
          sql`${grades.status} IN ('graded', 'finalized')`
        )
      ),
    db
      .select({ total: sql<number>`sum(${debts.remainingAmount})` })
      .from(debts)
      .where(
        and(
          eq(debts.studentId, userId),
          sql`${debts.status} IN ('active', 'overdue')`
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      ),
    db
      .select({
        id: grades.id,
        score: grades.score,
        letterGrade: grades.letterGrade,
        gradedAt: grades.gradedAt,
        examName: exams.name,
        courseName: courses.name,
      })
      .from(grades)
      .innerJoin(exams, eq(grades.examId, exams.id))
      .innerJoin(classes, eq(exams.classId, classes.id))
      .innerJoin(courses, eq(classes.courseId, courses.id))
      .where(eq(grades.studentId, userId))
      .orderBy(desc(grades.gradedAt))
      .limit(5),
    db
      .select({
        id: classes.id,
        className: classes.name,
        room: classes.room,
        schedule: classes.schedule,
        courseName: courses.name,
      })
      .from(enrollments)
      .innerJoin(classes, eq(enrollments.classId, classes.id))
      .innerJoin(courses, eq(classes.courseId, courses.id))
      .where(
        and(
          eq(enrollments.studentId, userId),
          eq(enrollments.status, "enrolled"),
          sql`${classes.status} IN ('open', 'in_progress')`
        )
      )
      .limit(5),
  ]);

  return {
    enrolledCount: enrolledCountResult?.count || 0,
    avgScore: Number(avgGradeResult?.avg || 0).toFixed(2),
    totalDebt: Number(debtResult?.total || 0),
    unreadNotifications: notificationResult?.count || 0,
    recentGrades,
    upcomingClasses,
  };
}

export async function getStudentCourses(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("student-courses", `student-${userId}`, "enrollments");

  return db
    .select({
      enrollment: enrollments,
      class: classes,
      course: courses,
      program: programs,
      lecturer: user,
    })
    .from(enrollments)
    .innerJoin(classes, eq(enrollments.classId, classes.id))
    .innerJoin(courses, eq(classes.courseId, courses.id))
    .innerJoin(programs, eq(courses.programId, programs.id))
    .leftJoin(user, eq(classes.lecturerId, user.id))
    .where(eq(enrollments.studentId, userId))
    .orderBy(desc(enrollments.enrolledAt));
}

export async function getStudentSchedule(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("student-schedule", `student-${userId}`, "enrollments", "classes");

  return db
    .select({
      enrollment: enrollments,
      class: classes,
      course: courses,
      lecturer: user,
    })
    .from(enrollments)
    .innerJoin(classes, eq(enrollments.classId, classes.id))
    .innerJoin(courses, eq(classes.courseId, courses.id))
    .leftJoin(user, eq(classes.lecturerId, user.id))
    .where(
      and(
        eq(enrollments.studentId, userId),
        eq(enrollments.status, "enrolled"),
        or(eq(classes.status, "open"), eq(classes.status, "in_progress"))
      )
    );
}

export async function getStudentGrades(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("student-grades", `student-${userId}`, "grades");

  return db
    .select({
      grade: grades,
      exam: exams,
      class: classes,
      course: courses,
    })
    .from(grades)
    .innerJoin(exams, eq(grades.examId, exams.id))
    .innerJoin(classes, eq(exams.classId, classes.id))
    .innerJoin(courses, eq(classes.courseId, courses.id))
    .where(eq(grades.studentId, userId))
    .orderBy(desc(exams.examDate));
}

export async function getStudentCertificates(userId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("student-certificates", `student-${userId}`, "certificates");

  return db
    .select({
      certificate: certificates,
      program: programs,
    })
    .from(certificates)
    .innerJoin(programs, eq(certificates.programId, programs.id))
    .where(eq(certificates.studentId, userId))
    .orderBy(desc(certificates.createdAt));
}

export async function getStudentNotifications(userId: string) {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 300 });
  cacheTag("student-notifications", `student-${userId}`, "notifications");

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function getStudentPaymentsAndDebts(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(
    "student-payments",
    `student-${userId}`,
    "payments",
    "debts"
  );

  const [userPayments, userDebts] = await Promise.all([
    db
      .select()
      .from(payments)
      .where(eq(payments.studentId, userId))
      .orderBy(desc(payments.createdAt)),
    db
      .select()
      .from(debts)
      .where(eq(debts.studentId, userId))
      .orderBy(desc(debts.createdAt)),
  ]);

  return { userPayments, userDebts };
}

// ─── Portal: Registration ─────────────────────────────────────────────────────

export async function getOpenClasses() {
  "use cache";
  cacheLife("minutes");
  cacheTag("open-classes", "classes", "courses", "programs");

  return db
    .select({
      class: classes,
      course: courses,
      program: programs,
      lecturer: user,
    })
    .from(classes)
    .innerJoin(courses, eq(classes.courseId, courses.id))
    .innerJoin(programs, eq(courses.programId, programs.id))
    .leftJoin(user, eq(classes.lecturerId, user.id))
    .where(eq(classes.status, "open"))
    .orderBy(programs.name, courses.name);
}

export async function getStudentEnrollments(userId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("student-enrollments", `student-${userId}`, "enrollments");

  return db
    .select()
    .from(enrollments)
    .where(eq(enrollments.studentId, userId));
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, programs, classes, payments, enrollments } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const role = session.user.role;
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Total Students
    const totalStudentsRes = await db.select({ count: count() }).from(user).where(eq(user.role, "student"));
    const totalStudents = totalStudentsRes[0].count;

    // Total Programs
    const totalProgramsRes = await db.select({ count: count() }).from(programs);
    const totalPrograms = totalProgramsRes[0].count;

    // Active Classes
    const activeClassesRes = await db.select({ count: count() }).from(classes).where(eq(classes.status, "in_progress"));
    const activeClasses = activeClassesRes[0].count;

    // Total Revenue
    const totalRevenueRes = await db.select({ total: sql<number>`sum(${payments.amount})` }).from(payments).where(eq(payments.status, "completed"));
    const totalRevenue = totalRevenueRes[0].total || 0;

    // Payment Status Distribution
    const paymentStatusDistribution = await db.select({
      status: payments.status,
      count: count()
    }).from(payments).groupBy(payments.status);

    // Enrollments by month (last 6 months) - SQLite specific date logic
    const enrollmentsByMonth = await db.select({
      month: sql<string>`strftime('%Y-%m', ${enrollments.enrolledAt})`,
      count: count()
    }).from(enrollments)
      .where(sql`${enrollments.enrolledAt} >= date('now', '-6 months')`)
      .groupBy(sql`strftime('%Y-%m', ${enrollments.enrolledAt})`)
      .orderBy(sql`strftime('%Y-%m', ${enrollments.enrolledAt})`);

    return NextResponse.json({
      totalStudents,
      totalPrograms,
      activeClasses,
      totalRevenue,
      paymentStatusDistribution,
      enrollmentsByMonth,
      revenueByProgram: [] // Placeholder for complex join
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

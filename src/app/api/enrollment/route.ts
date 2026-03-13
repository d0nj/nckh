import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { enrollments, classes } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { nanoid } from "nanoid";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const role = session.user.role;

    // IDOR fix: students can only see their own enrollments
    const studentId =
      role === "student"
        ? session.user.id
        : searchParams.get("studentId");

    let query = db.select().from(enrollments);
    
    const conditions = [];
    if (studentId) conditions.push(eq(enrollments.studentId, studentId));
    if (classId) conditions.push(eq(enrollments.classId, classId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const data = await query;
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const role = session.user.role;

    // IDOR fix: students can only enroll themselves
    const studentId =
      role === "student"
        ? session.user.id
        : body.studentId;

    const classId = body.classId;

    if (!classId || !studentId) {
      return NextResponse.json({ error: "classId and studentId are required" }, { status: 400 });
    }

    // Check class capacity
    const targetClass = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
    if (!targetClass.length) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const currentEnrollments = await db.select({ count: count() })
      .from(enrollments)
      .where(and(eq(enrollments.classId, classId), eq(enrollments.status, "enrolled")));
    
    const enrolledCount = currentEnrollments[0].count;
    const capacity = targetClass[0].maxStudents || 0;
    
    const status = enrolledCount >= capacity ? "waitlisted" : "enrolled";

    // Mass assignment fix: only allow explicit fields
    const newEnrollment = await db.insert(enrollments).values({
      id: nanoid(),
      classId,
      studentId,
      status,
      enrolledAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newEnrollment[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

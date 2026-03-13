import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { grades, exams, user } from "@/db/schema";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const examId = searchParams.get("examId");
    const role = session.user.role;

    // IDOR fix: students can only see their own grades
    const studentId =
      role === "student"
        ? session.user.id
        : searchParams.get("studentId");

    let conditions = [];
    if (examId) conditions.push(eq(grades.examId, examId));
    if (studentId) conditions.push(eq(grades.studentId, studentId));
    // If student and no studentId filter was added (shouldn't happen, but safeguard)
    if (role === "student" && !studentId) {
      conditions.push(eq(grades.studentId, session.user.id));
    }

    const result = await db
      .select({
        id: grades.id,
        examId: grades.examId,
        studentId: grades.studentId,
        score: grades.score,
        letterGrade: grades.letterGrade,
        status: grades.status,
        gradedBy: grades.gradedBy,
        gradedAt: grades.gradedAt,
        note: grades.note,
        examName: exams.name,
        studentName: user.name,
      })
      .from(grades)
      .leftJoin(exams, eq(grades.examId, exams.id))
      .leftJoin(user, eq(grades.studentId, user.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching grades:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admin/staff can create grades
    const role = session.user.role;
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Mass assignment fix: only allow explicit fields
    const { examId, studentId, score, letterGrade, note } = body;

    if (!examId || !studentId || score === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newGrade = await db
      .insert(grades)
      .values({
        id: nanoid(),
        examId,
        studentId,
        score,
        letterGrade,
        status: "graded",
        gradedBy: session.user.id,
        gradedAt: new Date().toISOString(),
        note,
      })
      .returning();

    return NextResponse.json(newGrade[0], { status: 201 });
  } catch (error) {
    console.error("Error creating grade:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

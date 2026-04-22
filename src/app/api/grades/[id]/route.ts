import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { grades, exams, user } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const [grade] = await db
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
      .where(eq(grades.id, id))
      .limit(1);

    if (!grade) return NextResponse.json({ error: "Grade not found" }, { status: 404 });

    // IDOR fix: students can only view their own grades
    if (session.user.role === "student" && grade.studentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(grade);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const role = session.user.role;
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Mass assignment fix: only allow score and note (feedback)
    const updateData: Record<string, unknown> = {
      gradedBy: session.user.id,
      gradedAt: new Date().toISOString(),
    };
    if (body.score !== undefined) updateData.score = body.score;
    if (body.letterGrade !== undefined) updateData.letterGrade = body.letterGrade;
    if (body.note !== undefined) updateData.note = body.note;

    const updated = await db
      .update(grades)
      .set(updateData)
      .where(eq(grades.id, id))
      .returning();

    if (!updated.length) return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const deleted = await db.delete(grades).where(eq(grades.id, id)).returning();
    if (!deleted.length) return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

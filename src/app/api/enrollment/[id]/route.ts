import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { enrollments, classes, user } from "@/db/schema";
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
    const enrollment = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, id))
      .get();

    if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    // IDOR fix: students can only view their own enrollments
    if (session.user.role === "student" && enrollment.studentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(enrollment);
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

    // Mass assignment fix: only allow updating status
    const updateData: Record<string, unknown> = {};
    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.status === "completed") {
      updateData.completedAt = new Date().toISOString();
    }

    const updated = await db
      .update(enrollments)
      .set(updateData)
      .where(eq(enrollments.id, id))
      .returning();

    if (!updated.length) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
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
    const deleted = await db.delete(enrollments).where(eq(enrollments.id, id)).returning();
    if (!deleted.length) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

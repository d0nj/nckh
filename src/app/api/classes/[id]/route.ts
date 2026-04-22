import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { classes, courses, user, enrollments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [cls] = await db
      .select({
        id: classes.id,
        courseId: classes.courseId,
        lecturerId: classes.lecturerId,
        code: classes.code,
        name: classes.name,
        maxStudents: classes.maxStudents,
        currentStudents: classes.currentStudents,
        room: classes.room,
        schedule: classes.schedule,
        startDate: classes.startDate,
        endDate: classes.endDate,
        status: classes.status,
        createdAt: classes.createdAt,
        courseName: courses.name,
        lecturerName: user.name,
        enrollmentCount: sql<number>`count(${enrollments.id})`.as("enrollmentCount"),
      })
      .from(classes)
      .leftJoin(courses, eq(classes.courseId, courses.id))
      .leftJoin(user, eq(classes.lecturerId, user.id))
      .leftJoin(enrollments, eq(classes.id, enrollments.classId))
      .where(eq(classes.id, id))
      .groupBy(classes.id, courses.name, user.name)
      .limit(1);

    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json(cls);
  } catch (error) {
    console.error("Error fetching class:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Only allow updating specific fields
    const allowedFields: Record<string, unknown> = {
      name: body.name,
      courseId: body.courseId,
      lecturerId: body.lecturerId,
      code: body.code,
      maxStudents: body.maxStudents,
      room: body.room,
      schedule: body.schedule ? JSON.stringify(body.schedule) : undefined,
      startDate: body.startDate,
      endDate: body.endDate,
      status: body.status,
    };
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(allowedFields)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    const updatedClass = await db
      .update(classes)
      .set(updateData)
      .where(eq(classes.id, id))
      .returning();

    if (!updatedClass.length) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json(updatedClass[0]);
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const deletedClass = await db
      .delete(classes)
      .where(eq(classes.id, id))
      .returning();

    if (!deletedClass.length) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

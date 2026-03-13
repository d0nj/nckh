import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { classes, courses, user } from "@/db/schema";
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
    const courseId = searchParams.get("courseId");
    const lecturerId = searchParams.get("lecturerId");

    let conditions = [];
    if (courseId) conditions.push(eq(classes.courseId, courseId));
    if (lecturerId) conditions.push(eq(classes.lecturerId, lecturerId));

    const result = await db
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
      })
      .from(classes)
      .leftJoin(courses, eq(classes.courseId, courses.id))
      .leftJoin(user, eq(classes.lecturerId, user.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.user.role !== "admin" && session.user.role !== "staff")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { courseId, lecturerId, code, name, maxStudents, room, schedule, startDate, endDate, status } = body;

    if (!courseId || !code || !name || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newClass = await db
      .insert(classes)
      .values({
        id: nanoid(),
        courseId,
        lecturerId,
        code,
        name,
        maxStudents: maxStudents || 0,
        currentStudents: 0,
        room,
        schedule: schedule ? JSON.stringify(schedule) : null,
        startDate: startDate,
        endDate: endDate,
        status: status || "open",
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newClass[0], { status: 201 });
  } catch (error) {
    console.error("Error creating class:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

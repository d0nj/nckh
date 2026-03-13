import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { exams } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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

    let query = db.select().from(exams).orderBy(desc(exams.createdAt));
    if (classId) {
      query = query.where(eq(exams.classId, classId)) as any;
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
    
    const role = session.user.role;
    if (role !== "admin" && role !== "staff" && role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const newExam = await db.insert(exams).values({
      id: nanoid(),
      classId: body.classId,
      name: body.name,
      type: body.type,
      examDate: body.examDate,
      startTime: body.startTime,
      endTime: body.endTime,
      room: body.room,
      duration: body.duration,
      maxScore: body.maxScore,
      weight: body.weight,
      status: body.status || "scheduled",
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newExam[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

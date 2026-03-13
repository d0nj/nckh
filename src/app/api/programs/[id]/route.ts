import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { programs, courses } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const program = await db.select().from(programs).where(eq(programs.id, id)).limit(1);
    
    if (!program.length) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    const programCourses = await db.select().from(courses).where(eq(courses.programId, id));

    return NextResponse.json({ ...program[0], courses: programCourses });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const role = session.user.role;
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Only allow updating specific fields
    const allowedFields: Record<string, unknown> = {
      name: body.name,
      description: body.description,
      type: body.type,
      durationHours: body.durationHours,
      totalCredits: body.totalCredits,
      tuitionFee: body.tuitionFee,
      status: body.status,
    };
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(allowedFields)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }
    updateData.updatedAt = new Date().toISOString();

    const updatedProgram = await db.update(programs)
      .set(updateData)
      .where(eq(programs.id, id))
      .returning();

    if (!updatedProgram.length) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json(updatedProgram[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const role = session.user.role;
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const deletedProgram = await db.delete(programs).where(eq(programs.id, id)).returning();

    if (!deletedProgram.length) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Program deleted successfully" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

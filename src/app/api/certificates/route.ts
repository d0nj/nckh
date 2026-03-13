import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const role = session.user.role;

    // IDOR fix: students can only see their own certificates
    const studentId =
      role === "student"
        ? session.user.id
        : searchParams.get("studentId");

    let query = db.select().from(certificates).orderBy(desc(certificates.createdAt));
    
    const conditions = [];
    if (studentId) conditions.push(eq(certificates.studentId, studentId));
    if (status) conditions.push(eq(certificates.status, status as "pending" | "approved" | "printed" | "issued" | "revoked"));
    // If student and no studentId filter (safeguard)
    if (role === "student" && !studentId) {
      conditions.push(eq(certificates.studentId, session.user.id));
    }
    
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
    
    // Only admin/staff can create certificates
    const role = session.user.role;
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Mass assignment fix: only allow explicit fields
    const { studentId, programId, certificateNumber, issueDate, status } = body;

    if (!studentId || !programId || !certificateNumber || !issueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newCertificate = await db.insert(certificates).values({
      id: nanoid(),
      studentId,
      programId,
      certificateNumber,
      issueDate,
      status: status || "pending",
      registryNumber: body.registryNumber || "",
      type: body.type || "certificate",
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newCertificate[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

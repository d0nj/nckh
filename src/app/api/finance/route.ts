import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema";
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
    // Students can only see their own financial data
    const studentId =
      role === "student"
        ? session.user.id
        : searchParams.get("studentId");

    const conditions = [];
    if (studentId) conditions.push(eq(payments.studentId, studentId));
    if (status) conditions.push(eq(payments.status, status as "completed" | "pending" | "failed" | "refunded"));

    let query = db.select().from(payments).orderBy(desc(payments.createdAt));

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
    
    const role = session.user.role;
    if (role !== "admin" && role !== "staff") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Whitelist allowed fields — prevent mass assignment
    const newPayment = await db.insert(payments).values({
      id: nanoid(),
      studentId: body.studentId,
      amount: body.amount,
      type: body.type,
      description: body.description,
      status: body.status,
      debtId: body.debtId,
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newPayment[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

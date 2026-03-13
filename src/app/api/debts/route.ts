import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { debts, user } from "@/db/schema";
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
    // Students can only see their own debts
    const studentId =
      role === "student"
        ? session.user.id
        : searchParams.get("studentId");

    const conditions = [];
    if (studentId) conditions.push(eq(debts.studentId, studentId));
    if (status) conditions.push(eq(debts.status, status as "active" | "paid" | "overdue" | "waived"));

    const result = await db
      .select({
        id: debts.id,
        studentId: debts.studentId,
        amount: debts.amount,
        remainingAmount: debts.remainingAmount,
        reason: debts.reason,
        dueDate: debts.dueDate,
        status: debts.status,
        createdAt: debts.createdAt,
        studentName: user.name,
      })
      .from(debts)
      .leftJoin(user, eq(debts.studentId, user.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(debts.createdAt));

    return NextResponse.json(result);
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
    const { studentId, amount, reason, dueDate } = body;
    if (!studentId || !amount || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Whitelist allowed fields — prevent mass assignment
    const newDebt = await db.insert(debts).values({
      id: nanoid(),
      studentId,
      amount,
      remainingAmount: amount,
      reason,
      dueDate,
      status: body.status || "active",
      createdAt: new Date().toISOString(),
    }).returning();

    return NextResponse.json(newDebt[0], { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { debts } from "@/db/schema";
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
    const debt = await db.select().from(debts).where(eq(debts.id, id)).get();
    if (!debt) return NextResponse.json({ error: "Debt not found" }, { status: 404 });

    // Students can only view their own debts
    if (session.user.role === "student" && debt.studentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(debt);
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

    // Whitelist allowed fields — prevent mass assignment
    const updateData: Record<string, any> = {};
    if (body.description !== undefined) updateData.reason = body.description;
    if (body.reason !== undefined) updateData.reason = body.reason;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await db.update(debts).set(updateData).where(eq(debts.id, id)).returning();
    if (!updated.length) return NextResponse.json({ error: "Debt not found" }, { status: 404 });
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
    const deleted = await db.delete(debts).where(eq(debts.id, id)).returning();
    if (!deleted.length) return NextResponse.json({ error: "Debt not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

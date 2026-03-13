import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const txnRef = req.nextUrl.searchParams.get("txnRef");

  if (!txnRef) {
    return NextResponse.json({ error: "Missing txnRef" }, { status: 400 });
  }

  const [payment] = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      status: payments.status,
      transactionId: payments.transactionId,
      description: payments.description,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      studentId: payments.studentId,
    })
    .from(payments)
    .where(eq(payments.transactionId, txnRef))
    .limit(1);

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Only allow the student who owns this payment to see it
  if (payment.studentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    status: payment.status,
    amount: payment.amount,
    txnRef: payment.transactionId,
    description: payment.description,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
  });
}

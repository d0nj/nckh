import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { payments, debts, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { vnpay } from "@/lib/vnpay";
import { dateFormat, getDateInGMT7 } from "vnpay";

/**
 * POST /api/payment/verify
 *
 * Actively queries VNPay via queryDr to check the real payment status.
 * This is essential for localhost/demo where IPN can't reach the server.
 * In production, IPN should handle this — but queryDr serves as a reliable fallback.
 */

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount) + " ₫";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { txnRef } = (await req.json()) as { txnRef: string };

  if (!txnRef) {
    return NextResponse.json({ error: "Missing txnRef" }, { status: 400 });
  }

  // Look up the payment in our DB
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.transactionId, txnRef))
    .limit(1);

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.studentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // If already finalized, just return the current status
  if (payment.status !== "pending") {
    return NextResponse.json({
      status: payment.status,
      amount: payment.amount,
      txnRef: payment.transactionId,
      description: payment.description,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
    });
  }

  // Query VNPay for the real status
  try {
    const createdDate = new Date(payment.createdAt);
    const transactionDate = Number(dateFormat(getDateInGMT7(createdDate)));
    const createDate = Number(dateFormat(getDateInGMT7(new Date())));

    const result = await vnpay.queryDr({
      vnp_RequestId: crypto.randomUUID().replace(/-/g, "").slice(0, 16),
      vnp_IpAddr: "127.0.0.1",
      vnp_TxnRef: txnRef,
      vnp_TransactionNo: 0, // We don't have this yet for pending payments
      vnp_OrderInfo: `Verify payment ${txnRef}`,
      vnp_TransactionDate: transactionDate,
      vnp_CreateDate: createDate,
    });

    // Map VNPay transaction status to our internal status
    const vnpTxnStatus = String(result.vnp_TransactionStatus ?? "");

    if (vnpTxnStatus === "00") {
      // Payment successful — update DB (same logic as IPN handler)
      await db.transaction(async (tx) => {
        const updated = await tx
          .update(payments)
          .set({
            status: "completed",
            paidAt: new Date().toISOString(),
          })
          .where(
            and(eq(payments.id, payment.id), eq(payments.status, "pending"))
          )
          .returning({ id: payments.id });

        if (updated.length === 0) {
          return; // Already processed by IPN
        }

        // Update linked debt
        if (payment.debtId) {
          const debtResult = await tx
            .select()
            .from(debts)
            .where(eq(debts.id, payment.debtId))
            .limit(1);

          if (debtResult.length > 0) {
            const debt = debtResult[0];
            const newRemaining = Math.max(
              0,
              debt.remainingAmount - payment.amount
            );
            await tx
              .update(debts)
              .set({
                remainingAmount: newRemaining,
                status: newRemaining <= 0 ? "paid" : debt.status,
              })
              .where(eq(debts.id, payment.debtId));
          }
        }

        // Create success notification
        await tx.insert(notifications).values({
          id: crypto.randomUUID(),
          userId: payment.studentId,
          title: "Thanh toán thành công",
          content: `Bạn đã thanh toán thành công ${formatAmount(payment.amount)}. Mã giao dịch: ${txnRef}`,
          type: "payment",
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      });

      return NextResponse.json({
        status: "completed",
        amount: payment.amount,
        txnRef: payment.transactionId,
        description: payment.description,
        paidAt: new Date().toISOString(),
        createdAt: payment.createdAt,
      });
    }

    if (vnpTxnStatus === "02") {
      // Payment failed
      await db.transaction(async (tx) => {
        const updated = await tx
          .update(payments)
          .set({ status: "failed" })
          .where(
            and(eq(payments.id, payment.id), eq(payments.status, "pending"))
          )
          .returning({ id: payments.id });

        if (updated.length > 0) {
          await tx.insert(notifications).values({
            id: crypto.randomUUID(),
            userId: payment.studentId,
            title: "Thanh toán thất bại",
            content: `Thanh toán ${formatAmount(payment.amount)} không thành công. Mã giao dịch: ${txnRef}`,
            type: "payment",
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      });

      return NextResponse.json({
        status: "failed",
        amount: payment.amount,
        txnRef: payment.transactionId,
        description: payment.description,
        paidAt: null,
        createdAt: payment.createdAt,
      });
    }

    // Still pending or other transitional status
    return NextResponse.json({
      status: "pending",
      amount: payment.amount,
      txnRef: payment.transactionId,
      description: payment.description,
      paidAt: null,
      createdAt: payment.createdAt,
      vnpayStatus: vnpTxnStatus,
    });
  } catch (err) {
    // queryDr failed (network, sandbox issues, etc.) — return current DB status
    console.error("queryDr failed:", err);
    return NextResponse.json({
      status: payment.status,
      amount: payment.amount,
      txnRef: payment.transactionId,
      description: payment.description,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      queryError: true,
    });
  }
}

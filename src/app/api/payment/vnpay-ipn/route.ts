import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments, debts, notifications } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { vnpay } from "@/lib/vnpay";
import type { ReturnQueryFromVNPay } from "vnpay";
import {
  IpnFailChecksum,
  IpnOrderNotFound,
  InpOrderAlreadyConfirmed,
  IpnInvalidAmount,
  IpnSuccess,
  IpnUnknownError,
} from "vnpay";

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount) + " ₫";

export async function GET(req: Request) {
  try {
    const query = Object.fromEntries(
      new URL(req.url).searchParams.entries()
    ) as ReturnQueryFromVNPay;

    const result = vnpay.verifyIpnCall(query);

    if (!result.isVerified) {
      return NextResponse.json(IpnFailChecksum);
    }

    // Find payment by transactionId
    const paymentResult = await db
      .select()
      .from(payments)
      .where(eq(payments.transactionId, result.vnp_TxnRef))
      .limit(1);

    if (paymentResult.length === 0) {
      return NextResponse.json(IpnOrderNotFound);
    }

    const payment = paymentResult[0];

    // Handle failed payment from VNPay
    if (!result.isSuccess) {
      await db.transaction(async (tx) => {
        // CAS: only mark as failed if still pending
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
            content: `Thanh toán ${formatAmount(payment.amount)} không thành công. Mã giao dịch: ${result.vnp_TxnRef}`,
            type: "payment",
            isRead: false,
            createdAt: new Date().toISOString(),
          });
        }
      });

      return NextResponse.json(IpnSuccess);
    }

    // Amount mismatch (vnpay library auto-converts the amount)
    if (payment.amount !== Number(result.vnp_Amount)) {
      return NextResponse.json(IpnInvalidAmount);
    }

    // Process successful payment in a transaction
    const txResult = await db.transaction(async (tx) => {
      // CAS: only mark as completed if still pending
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
        // Another IPN already processed this payment
        return "already_confirmed" as const;
      }

      // Update the linked debt if present
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
        content: `Bạn đã thanh toán thành công ${formatAmount(payment.amount)}. Mã giao dịch: ${result.vnp_TxnRef}`,
        type: "payment",
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      return "success" as const;
    });

    if (txResult === "already_confirmed") {
      return NextResponse.json(InpOrderAlreadyConfirmed);
    }

    return NextResponse.json(IpnSuccess);
  } catch {
    return NextResponse.json(IpnUnknownError);
  }
}

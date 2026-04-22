import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { debts, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { vnpay, toVNTimeString } from "@/lib/vnpay";
import { ProductCode, VnpLocale } from "vnpay";

/**
 * Remove Vietnamese diacritics and special characters from a string.
 * VNPay requires vnp_OrderInfo to be "Tieng Viet khong dau" with no special chars.
 */
function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim();
}

/**
 * Normalize IP address: strip IPv6-mapped IPv4 prefix (::ffff:) and
 * fall back to a valid IP if the result is still a loopback/empty.
 */
function normalizeIp(req: NextRequest): string {
  const raw =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  // Strip IPv6-mapped IPv4 prefix
  return raw.replace(/^::ffff:/, "");
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { debtId } = (await req.json()) as { debtId: string };

  if (!debtId) {
    return NextResponse.json({ error: "Missing debtId" }, { status: 400 });
  }

  const [debt] = await db
    .select()
    .from(debts)
    .where(eq(debts.id, debtId));

  if (!debt) {
    return NextResponse.json({ error: "Debt not found" }, { status: 404 });
  }

  if (debt.status !== "active" && debt.status !== "overdue") {
    return NextResponse.json(
      { error: "Debt is not payable" },
      { status: 400 }
    );
  }

  if (debt.studentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // VNPay requires vnp_TxnRef to be alphanumeric only (no - or _).
  // nanoid's default alphabet includes - and _, so use a custom one.
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const randomBytes = crypto.getRandomValues(new Uint8Array(12));
  const txnRef = Array.from(randomBytes, (b) => alphabet[b % alphabet.length]).join("");

  // VNPay requires vnp_Amount to be an integer (library multiplies by 100).
  // remainingAmount is a real type, so round to avoid float issues.
  const amount = Math.round(debt.remainingAmount);

  const newPayment = {
    id: nanoid(),
    studentId: session.user.id,
    amount: amount,
    debtId: debtId,
    type: "tuition" as const,
    method: "online" as const,
    status: "pending" as const,
    description: `Thanh toán: ${debt.reason}`,
    transactionId: txnRef,
    createdAt: new Date().toISOString(),
  };

  await db.insert(payments).values(newPayment);

  const paymentUrl = vnpay.buildPaymentUrl({
    vnp_Amount: amount,
    vnp_IpAddr: normalizeIp(req),
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: removeDiacritics(`Thanh toan ${debt.reason}`),
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl:
      process.env.VNPAY_RETURN_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payment/vnpay-return`,
    vnp_Locale: VnpLocale.VN,
    vnp_ExpireDate: Number(toVNTimeString(new Date(Date.now() + 15 * 60 * 1000))),
  });

  return NextResponse.json({ paymentUrl, paymentId: newPayment.id });
}

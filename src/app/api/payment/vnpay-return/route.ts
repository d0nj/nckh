import { NextResponse } from "next/server";
import { vnpay } from "@/lib/vnpay";
import type { ReturnQueryFromVNPay } from "vnpay";

export async function GET(req: Request) {
  const searchParams = new URL(req.url).searchParams;
  const query = Object.fromEntries(searchParams.entries()) as ReturnQueryFromVNPay;

  const result = vnpay.verifyReturnUrl(query);

  // Only pass txnRef to the result page — actual status is fetched from DB
  // This prevents URL parameter spoofing
  if (result.isVerified && result.vnp_TxnRef) {
    const redirectPath = `/portal/payments/result?txnRef=${result.vnp_TxnRef}`;
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  // Invalid signature — no txnRef to look up
  const redirectPath = `/portal/payments/result?error=invalid_signature`;
  return NextResponse.redirect(new URL(redirectPath, req.url));
}

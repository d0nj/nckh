import { NextResponse } from "next/server";
import { vnpay } from "@/lib/vnpay";
import type { ReturnQueryFromVNPay } from "vnpay";

export async function GET(req: Request) {
  const searchParams = new URL(req.url).searchParams;
  const query = Object.fromEntries(searchParams.entries()) as ReturnQueryFromVNPay;

  const result = vnpay.verifyReturnUrl(query);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

  if (result.isVerified && result.vnp_TxnRef) {
    const redirectPath = `/portal/payments/result?txnRef=${result.vnp_TxnRef}`;
    return NextResponse.redirect(new URL(redirectPath, baseUrl));
  }

  const redirectPath = `/portal/payments/result?error=invalid_signature`;
  return NextResponse.redirect(new URL(redirectPath, baseUrl));
}

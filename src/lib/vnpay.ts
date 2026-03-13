import { VNPay, HashAlgorithm } from "vnpay";

export const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMN_CODE!,
  secureSecret: process.env.VNPAY_HASH_SECRET!,
  vnpayHost: "https://sandbox.vnpayment.vn",
  testMode: true,
  hashAlgorithm: HashAlgorithm.SHA512,
  enableLog: process.env.NODE_ENV === "development",
});

export const VNPAY_RETURN_URL =
  process.env.VNPAY_RETURN_URL ||
  `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payment/vnpay-return`;

export const VNPAY_IPN_URL =
  process.env.VNPAY_IPN_URL ||
  `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payment/vnpay-ipn`;

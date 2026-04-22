import { VNPay, HashAlgorithm } from "vnpay";

export const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMN_CODE!,
  secureSecret: process.env.VNPAY_HASH_SECRET!,
  vnpayHost: "https://sandbox.vnpayment.vn",
  testMode: true,
  hashAlgorithm: HashAlgorithm.SHA512,
  enableLog: process.env.NODE_ENV === "development",
});

export function toVNTimeString(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
}

export const VNPAY_RETURN_URL =
  process.env.VNPAY_RETURN_URL ||
  `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payment/vnpay-return`;

export const VNPAY_IPN_URL =
  process.env.VNPAY_IPN_URL ||
  `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payment/vnpay-ipn`;

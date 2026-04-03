import { VNPay, ProductCode, VnpLocale } from "vnpay";

// VNPay Configuration
export const vnpayConfig = {
  // Merchant configuration from environment variables
  tmnCode: process.env.VNPAY_TMN_CODE || "",
  secureSecret: process.env.VNPAY_SECURE_SECRET || "",
  
  // VNPay API URLs
  vnpayHost: process.env.VNPAY_HOST || "https://sandbox.vnpayment.vn",
  
  // Return and IPN URLs
  returnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:3008/api/payments/vnpay-return",
  ipnUrl: process.env.VNPAY_IPN_URL || "http://localhost:3008/api/payments/vnpay-ipn",
  
  // Payment settings
  currency: "VND",
  locale: VnpLocale.VN,
  orderType: ProductCode.Other,
};

// Validate configuration
export function validateVNPayConfig(): void {
  const required = ["VNPAY_TMN_CODE", "VNPAY_SECURE_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️ Missing VNPay configuration: ${missing.join(", ")}`);
    console.warn("VNPay integration will not work properly without these settings.");
  }
}

// Create VNPay instance
export function createVNPayInstance() {
  return new VNPay({
    tmnCode: vnpayConfig.tmnCode,
    secureSecret: vnpayConfig.secureSecret,
    vnpayHost: vnpayConfig.vnpayHost,
    testMode: process.env.NODE_ENV !== "production",
    loggerFn: process.env.DEBUG === "true" ? console.log : undefined,
  });
}

export { ProductCode, VnpLocale };

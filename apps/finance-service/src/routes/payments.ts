import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { createDatabase } from "@thai-binh/database/pg";
import { VNPayService } from "../services/vnpay";
import { success, error, notFoundError } from "@thai-binh/utils/response";
import {
  IpnSuccess,
  IpnFailChecksum,
  IpnOrderNotFound,
  IpnInvalidAmount,
  IpnUnknownError,
} from "vnpay";

const app = new Hono();

// Validation schemas
const createPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  orderInfo: z.string().min(1),
  returnUrl: z.string().url().optional(),
  bankCode: z.string().optional(),
});

const queryTransactionSchema = z.object({
  transactionRef: z.string().min(1),
  transactionDate: z.string().min(1),
});

const refundSchema = z.object({
  transactionRef: z.string().min(1),
  transactionDate: z.string().min(1),
  amount: z.number().positive(),
  reason: z.string().min(1),
});

// Helper to extract client IP
function getClientIP(c: any): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return c.req.header("x-real-ip") || "127.0.0.1";
}

// Create payment URL
app.post("/create", zValidator("json", createPaymentSchema), async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const service = new VNPayService(db);
  const data = c.req.valid("json");
  const organizationId = c.req.header("X-Organization-Id") || "default";
  const userId = c.req.header("X-User-Id") || "system";

  try {
    const result = await service.createPayment({
      invoiceId: data.invoiceId,
      amount: data.amount,
      orderInfo: data.orderInfo,
      ipAddress: getClientIP(c),
      returnUrl: data.returnUrl,
      bankCode: data.bankCode,
    });

    if (!result.success) {
      return c.json(
        error("PAYMENT_CREATION_FAILED", result.error || "Unknown error"),
        400,
      );
    }

    return c.json(
      success(
        {
          paymentUrl: result.paymentUrl,
          transactionRef: result.transactionRef,
        },
        undefined,
      ),
      201,
    );
  } catch (err) {
    console.error("Create payment error:", err);
    return c.json(error("INTERNAL_ERROR", "Failed to create payment"), 500);
  }
});

// VNPay IPN (Instant Payment Notification) - Server to server
app.get("/vnpay-ipn", async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const service = new VNPayService(db);
  const query = c.req.query();

  console.log("VNPay IPN received:", query);

  try {
    const result = await service.verifyIPN(query);

    if (!result.isValid) {
      console.warn("IPN verification failed:", result.message);
      return c.json(IpnFailChecksum);
    }

    if (!result.isSuccess) {
      console.warn("Payment not successful:", result.message);
      return c.json(IpnUnknownError);
    }

    // Return appropriate response based on processing result
    return c.json(IpnSuccess);
  } catch (err) {
    console.error("IPN processing error:", err);
    return c.json(IpnUnknownError);
  }
});

// VNPay Return URL - Customer redirect after payment
app.get("/vnpay-return", async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const service = new VNPayService(db);
  const query = c.req.query();

  console.log("VNPay return URL accessed:", query);

  try {
    const result = await service.verifyReturnUrl(query);

    if (!result.isVerified) {
      return c.json(
        error("INVALID_CALLBACK", "Payment callback verification failed"),
        400,
      );
    }

    return c.json(
      success({
        isSuccess: result.isSuccess,
        message: result.message,
        transactionRef: result.transactionRef,
        amount: result.amount,
        orderInfo: result.orderInfo,
        bankCode: result.bankCode,
        payDate: result.payDate,
      }),
    );
  } catch (err) {
    console.error("Return URL processing error:", err);
    return c.json(
      error("INTERNAL_ERROR", "Failed to process payment return"),
      500,
    );
  }
});

// Query transaction status
app.post("/query", zValidator("json", queryTransactionSchema), async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const service = new VNPayService(db);
  const data = c.req.valid("json");

  try {
    const result = await service.queryTransaction(
      data.transactionRef,
      data.transactionDate,
    );

    if (!result.success) {
      return c.json(error("QUERY_FAILED", result.error || "Query failed"), 400);
    }

    return c.json(success(result.data));
  } catch (err) {
    console.error("Query transaction error:", err);
    return c.json(error("INTERNAL_ERROR", "Failed to query transaction"), 500);
  }
});

// Process refund
app.post("/refund", zValidator("json", refundSchema), async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const service = new VNPayService(db);
  const data = c.req.valid("json");
  const userId = c.req.header("X-User-Id") || "system";

  try {
    const result = await service.processRefund(
      data.transactionRef,
      data.transactionDate,
      data.amount,
      userId,
      data.reason,
    );

    if (!result.success) {
      return c.json(
        error("REFUND_FAILED", result.error || "Refund failed"),
        400,
      );
    }

    return c.json(success(result.data, undefined));
  } catch (err) {
    console.error("Refund processing error:", err);
    return c.json(error("INTERNAL_ERROR", "Failed to process refund"), 500);
  }
});

// Get payment by transaction reference
app.get("/:transactionRef", async (c) => {
  const db = createDatabase({ url: process.env.DATABASE_URL! });
  const transactionRef = c.req.param("transactionRef");

  try {
    const payment = await db.query.payments.findFirst({
      where: (payments, { eq }) =>
        eq(payments.transactionReference, transactionRef),
    });

    if (!payment) {
      return c.json(notFoundError("Payment", transactionRef), 404);
    }

    return c.json(success(payment));
  } catch (err) {
    console.error("Get payment error:", err);
    return c.json(error("INTERNAL_ERROR", "Failed to retrieve payment"), 500);
  }
});

export { app as paymentRoutes };

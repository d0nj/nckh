import { eq, and } from "drizzle-orm";
import type { Database } from "@thai-binh/database/pg";
import { schema } from "@thai-binh/database/pg";
import { createVNPayInstance, vnpayConfig, ProductCode, VnpLocale } from "../config/vnpay";
import type { VNPay } from "vnpay";

export interface CreatePaymentInput {
  invoiceId: string;
  amount: number;
  orderInfo: string;
  ipAddress: string;
  returnUrl?: string;
  bankCode?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentUrl?: string;
  transactionRef?: string;
  error?: string;
}

export class VNPayService {
  private vnpay: VNPay;

  constructor(private db: Database) {
    this.vnpay = createVNPayInstance();
  }

  /**
   * Create a payment URL for VNPay
   */
  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    try {
      // Generate unique transaction reference
      const txnRef = `${input.invoiceId}-${Date.now()}`;

      // Build payment URL
      const paymentUrl = this.vnpay.buildPaymentUrl({
        vnp_Amount: input.amount,
        vnp_IpAddr: input.ipAddress,
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: input.orderInfo,
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: input.returnUrl || vnpayConfig.returnUrl,
        vnp_Locale: VnpLocale.VN,
        vnp_BankCode: input.bankCode,
      });

      // Create payment record in database
      await this.db.insert(schema.payments).values({
        organizationId: "default", // Should be extracted from context
        invoiceId: input.invoiceId,
        amount: input.amount.toString(),
        currency: "VND",
        paymentMethod: "vnpay",
        transactionReference: txnRef,
        status: "pending",
        paymentNumber: txnRef,
      });

      return {
        success: true,
        paymentUrl,
        transactionReference: txnRef,
      };
    } catch (error) {
      console.error("VNPay create payment error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create payment",
      };
    }
  }

  /**
   * Verify IPN (Instant Payment Notification) from VNPay
   */
  async verifyIPN(query: Record<string, unknown>) {
    try {
      const verify = this.vnpay.verifyIpnCall(query);
      
      if (!verify.isVerified) {
        return {
          isValid: false,
          isSuccess: false,
          message: "Invalid signature",
        };
      }

      // Find payment by transaction reference
      const payment = await this.db.query.payments.findFirst({
        where: (payments, { eq }) => eq(payments.transactionReference, verify.vnp_TxnRef),
      });

      if (!payment) {
        return {
          isValid: false,
          isSuccess: false,
          message: "Payment not found",
        };
      }

      // Verify amount matches
      if (verify.vnp_Amount !== parseFloat(payment.amount)) {
        return {
          isValid: false,
          isSuccess: false,
          message: "Amount mismatch",
        };
      }

      // Update payment status based on VNPay response
      if (verify.isSuccess) {
        await this.db
          .update(schema.payments)
          .set({
            status: "completed",
            paidAt: new Date(),
          })
          .where(eq(schema.payments.id, payment.id));

        // Update invoice status
        if (payment.invoiceId) {
          await this.db
            .update(schema.invoices)
            .set({
              status: "paid",
              paidAmount: payment.amount,
            })
            .where(eq(schema.invoices.id, payment.invoiceId));
        }
      } else {
        await this.db
          .update(schema.payments)
          .set({
            status: "failed",
          })
          .where(eq(schema.payments.id, payment.id));
      }

      return {
        isValid: true,
        isSuccess: verify.isSuccess,
        message: verify.message,
        payment,
        vnpayData: verify,
      };
    } catch (error) {
      console.error("VNPay IPN verification error:", error);
      return {
        isValid: false,
        isSuccess: false,
        message: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }

  /**
   * Verify return URL callback from VNPay
   */
  async verifyReturnUrl(query: Record<string, unknown>) {
    try {
      const verify = this.vnpay.verifyReturnUrl(query);
      
      return {
        isVerified: verify.isVerified,
        isSuccess: verify.isSuccess,
        message: verify.message,
        transactionRef: verify.vnp_TxnRef,
        amount: verify.vnp_Amount,
        orderInfo: verify.vnp_OrderInfo,
        bankCode: verify.vnp_BankCode,
        payDate: verify.vnp_PayDate,
      };
    } catch (error) {
      console.error("VNPay return URL verification error:", error);
      return {
        isVerified: false,
        isSuccess: false,
        message: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }

  /**
   * Query transaction status
   */
  async queryTransaction(transactionRef: string, transactionDate: string) {
    try {
      const result = await this.vnpay.queryDr({
        vnp_TxnRef: transactionRef,
        vnp_TransDate: transactionDate,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error("VNPay query transaction error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Query failed",
      };
    }
  }

  /**
   * Process refund
   */
  async processRefund(
    transactionRef: string,
    transactionDate: string,
    amount: number,
    user: string,
    reason: string
  ) {
    try {
      // Find original payment
      const payment = await this.db.query.payments.findFirst({
        where: (payments, { eq }) => eq(payments.transactionRef, transactionRef),
      });

      if (!payment) {
        return {
          success: false,
          error: "Original payment not found",
        };
      }

      // Create refund request with VNPay
      const result = await this.vnpay.refund({
        vnp_TxnRef: transactionRef,
        vnp_TransDate: transactionDate,
        vnp_Amount: amount,
        vnp_TransactionType: "02", // Full refund or partial
        vnp_CreateBy: user,
      });

      // Create refund record
      await this.db.insert(schema.refunds).values({
        organizationId: payment.organizationId,
        paymentId: payment.id,
        amount: amount.toString(),
        reason,
        status: result.vnp_ResponseCode === "00" ? "processed" : "pending",
        requestedBy: user,
        processedAt: result.vnp_ResponseCode === "00" ? new Date() : null,
      });

      return {
        success: result.vnp_ResponseCode === "00",
        data: result,
      };
    } catch (error) {
      console.error("VNPay refund error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Refund failed",
      };
    }
  }
}

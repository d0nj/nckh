"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);

interface PaymentStatus {
  status: "pending" | "completed" | "failed" | "refunded";
  amount: number;
  txnRef: string;
  description: string | null;
  paidAt: string | null;
  createdAt: string;
}

const POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLL_DURATION = 60000; // 60 seconds

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const txnRef = searchParams.get("txnRef");
  const error = searchParams.get("error");

  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [pollExpired, setPollExpired] = useState(false);
  const pollStartRef = useRef<number>(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const verifyPayment = useCallback(
    async (isInitial = false) => {
      if (!txnRef) return;

      try {
        if (isInitial) setLoading(true);

        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txnRef }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || "Không thể tải thông tin giao dịch"
          );
        }

        const data: PaymentStatus = await res.json();
        setPayment(data);
        setFetchError(null);

        // If still pending, continue polling
        if (data.status === "pending") {
          const elapsed = Date.now() - pollStartRef.current;
          if (elapsed < MAX_POLL_DURATION) {
            pollTimerRef.current = setTimeout(
              () => verifyPayment(false),
              POLL_INTERVAL
            );
          } else {
            setPollExpired(true);
          }
        }
      } catch (err: any) {
        setFetchError(err.message);
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [txnRef]
  );

  useEffect(() => {
    if (!txnRef) return;

    pollStartRef.current = Date.now();
    setPollExpired(false);
    verifyPayment(true);

    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [txnRef, verifyPayment]);

  const handleManualRetry = () => {
    pollStartRef.current = Date.now();
    setPollExpired(false);
    verifyPayment(true);
  };

  // No txnRef and no error — redirect
  if (!txnRef && !error) {
    if (typeof window !== "undefined") {
      window.location.href = "/portal/payments";
    }
    return null;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Initial loading state */}
        {loading && !payment && (
          <Card>
            <CardHeader className="items-center text-center">
              <Loader2
                className="mb-2 size-16 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
              <CardTitle className="text-xl">
                Đang kiểm tra giao dịch…
              </CardTitle>
              <CardDescription>Vui lòng đợi trong giây lát.</CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Signature error from VNPay return */}
        {error && !loading && (
          <Card>
            <CardHeader className="items-center text-center">
              <AlertTriangle
                className="mb-2 size-16 text-yellow-500"
                aria-hidden="true"
              />
              <CardTitle className="text-xl">Có lỗi xảy ra</CardTitle>
              <CardDescription>
                Không thể xác thực giao dịch. Vui lòng liên hệ bộ phận hỗ trợ
                nếu tiền đã bị trừ.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center pt-2">
                <Link
                  href="/portal/payments"
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  Quay lại trang thanh toán
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fetch error */}
        {fetchError && !loading && (
          <Card>
            <CardHeader className="items-center text-center">
              <AlertTriangle
                className="mb-2 size-16 text-yellow-500"
                aria-hidden="true"
              />
              <CardTitle className="text-xl">
                Không thể tải giao dịch
              </CardTitle>
              <CardDescription>{fetchError}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-3 pt-2">
                <Button variant="outline" onClick={handleManualRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Thử lại
                </Button>
                <Link
                  href="/portal/payments"
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  Quay lại trang thanh toán
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success */}
        {payment?.status === "completed" && (
          <Card>
            <CardHeader className="items-center text-center">
              <CheckCircle2
                className="mb-2 size-16 text-green-500"
                aria-hidden="true"
              />
              <CardTitle className="text-xl">
                Thanh toán thành công!
              </CardTitle>
              <CardDescription>
                Giao dịch của bạn đã được xử lý thành công.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mã giao dịch</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {payment.txnRef}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Số tiền</span>
                  <span className="font-semibold text-green-600 tabular-nums">
                    {formatVND(payment.amount)}
                  </span>
                </div>
                {payment.description && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mô tả</span>
                    <span className="font-medium text-foreground">
                      {payment.description}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex justify-center pt-2">
                <Link
                  href="/portal/payments"
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  Quay lại trang thanh toán
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Failed */}
        {payment?.status === "failed" && (
          <Card>
            <CardHeader className="items-center text-center">
              <XCircle
                className="mb-2 size-16 text-red-500"
                aria-hidden="true"
              />
              <CardTitle className="text-xl">Thanh toán thất bại</CardTitle>
              <CardDescription>
                Giao dịch không thành công. Vui lòng thử lại hoặc liên hệ bộ
                phận hỗ trợ.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                {payment.txnRef && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Mã giao dịch</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {payment.txnRef}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link
                  href="/portal/payments"
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  Thử lại
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending — polling for status update */}
        {payment?.status === "pending" && (
          <Card>
            <CardHeader className="items-center text-center">
              {pollExpired ? (
                <AlertTriangle
                  className="mb-2 size-16 text-amber-500"
                  aria-hidden="true"
                />
              ) : (
                <Loader2
                  className="mb-2 size-16 animate-spin text-amber-500"
                  aria-hidden="true"
                />
              )}
              <CardTitle className="text-xl">
                {pollExpired
                  ? "Chưa xác nhận được thanh toán"
                  : "Đang xác nhận thanh toán…"}
              </CardTitle>
              <CardDescription>
                {pollExpired
                  ? "Hệ thống chưa nhận được xác nhận từ VNPay. Giao dịch có thể cần thêm thời gian để xử lý."
                  : "Đang kiểm tra trạng thái thanh toán với VNPay. Vui lòng đợi…"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mã giao dịch</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {payment.txnRef}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Số tiền</span>
                  <span className="font-semibold text-amber-600 tabular-nums">
                    {formatVND(payment.amount)}
                  </span>
                </div>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                {pollExpired && (
                  <Button variant="outline" onClick={handleManualRetry}>
                    <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                    Kiểm tra lại
                  </Button>
                )}
                <Link
                  href="/portal/payments"
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  Quay lại trang thanh toán
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

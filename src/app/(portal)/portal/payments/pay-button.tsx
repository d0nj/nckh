"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PayDebtButtonProps {
  debtId: string;
  amount: number;
  reason: string;
}

export function PayDebtButton({ debtId, amount, reason }: PayDebtButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/payment/create-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ debtId }),
      });

      if (!res.ok) {
        throw new Error("Failed to create payment URL");
      }

      const data = await res.json();
      window.location.href = data.paymentUrl;
    } catch {
      toast.error("Không thể tạo liên kết thanh toán");
      setLoading(false);
    }
  };

  return (
    <Button
      variant="default"
      size="sm"
      disabled={loading}
      onClick={handlePay}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Đang xử lý…
        </>
      ) : (
        "Thanh toán"
      )}
    </Button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface EnrollButtonProps {
  classId: string;
  studentId: string;
  isFull: boolean;
  alreadyEnrolled: boolean;
}

export function EnrollButton({ classId, studentId, isFull, alreadyEnrolled }: EnrollButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (alreadyEnrolled) {
    return (
      <Button variant="secondary" size="sm" disabled>
        <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
        Đã đăng ký
      </Button>
    );
  }

  const handleEnroll = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, studentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Đăng ký thất bại");
      }

      const data = await res.json();
      if (data.status === "waitlisted") {
        toast.success("Đã thêm vào danh sách chờ!");
      } else {
        toast.success("Đăng ký thành công!");
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isFull ? "outline" : "default"}
      size="sm"
      disabled={loading}
      onClick={handleEnroll}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Đang xử lý…
        </>
      ) : isFull ? (
        "Chờ slot"
      ) : (
        "Đăng ký"
      )}
    </Button>
  );
}

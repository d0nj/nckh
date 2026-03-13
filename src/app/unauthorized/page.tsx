import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <ShieldAlert className="h-24 w-24 text-red-500 mb-6" aria-hidden="true" />
      <h1 className="text-4xl font-bold tracking-tight mb-2">Truy cập bị từ chối</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md text-pretty">
        Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là một sự nhầm lẫn.
      </p>
      <Button render={<Link href="/dashboard" />} size="lg">
        Quay lại trang chủ
      </Button>
    </div>
  );
}

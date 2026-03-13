"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Portal error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="max-w-md w-full border-destructive/20 shadow-lg">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Đã xảy ra lỗi</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Hệ thống gặp sự cố khi tải dữ liệu. Vui lòng thử lại hoặc quay về cổng thông tin.
            </p>
          </div>
          {error.message && process.env.NODE_ENV === "development" && (
            <div className="bg-muted rounded-md p-3">
              <p className="text-xs text-muted-foreground font-mono break-all">{error.message}</p>
            </div>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button onClick={reset} variant="default" className="gap-2">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Thử lại
            </Button>
            <Button render={<Link href="/portal" />} variant="outline" className="gap-2">
                <Home className="h-4 w-4" aria-hidden="true" />
                Cổng thông tin
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

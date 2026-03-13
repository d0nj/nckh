import { Suspense } from "react";
import { GraduationCap } from "lucide-react";
import { CurrentYear } from "@/components/current-year";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Branding Panel */}
      <div className="relative hidden md:flex flex-col justify-between w-1/2 bg-primary overflow-hidden p-12 text-primary-foreground">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary z-0" />
        <div
          className="absolute top-0 left-0 w-full h-full opacity-10 z-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl z-0" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl z-0" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg backdrop-blur-sm border border-amber-500/30">
            <GraduationCap
              className="w-8 h-8 text-amber-400"
              aria-hidden="true"
            />
          </div>
          <span className="text-xl font-semibold tracking-tight">
            Đại học Quốc gia
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Hệ thống Quản lý Đào tạo
          </h1>
          <p className="text-lg opacity-80 leading-relaxed">
            Nền tảng quản lý đào tạo và học vụ toàn diện. Nâng cao hiệu quả quản
            lý, tối ưu hóa trải nghiệm học tập và giảng dạy.
          </p>
        </div>

        <div className="relative z-10 text-sm opacity-60">
          &copy;{" "}
          <Suspense fallback="2026">
            <CurrentYear />
          </Suspense>{" "}
          Hệ thống Quản lý Đào tạo. Bảo lưu mọi quyền.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center gap-2 mb-8">
          <div className="p-2 bg-primary rounded-lg">
            <GraduationCap
              className="w-6 h-6 text-amber-400"
              aria-hidden="true"
            />
          </div>
          <span className="text-lg font-bold text-foreground">
            Hệ thống Quản lý Đào tạo
          </span>
        </div>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

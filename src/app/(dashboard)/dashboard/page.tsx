import { Suspense } from "react";
import { requireAuth } from "@/lib/session";
import { getDashboardStats, getRecentEnrollments, getRecentPayments } from "@/lib/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, School, Wallet } from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-64 bg-muted rounded" />
    </div>
  );
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const formatDate = (date: string | null) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(date));
};

async function DashboardStatsCards() {
  const { totalStudents, totalPrograms, activeClasses, pendingPayments } = await getDashboardStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md motion-safe:transition-shadow bg-card animate-fade-in-up stagger-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tổng số học viên</CardTitle>
          <div className="p-2 bg-primary/10 rounded-full">
            <Users className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary tabular-nums">{totalStudents}</div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md motion-safe:transition-shadow bg-card animate-fade-in-up stagger-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Chương trình đào tạo</CardTitle>
          <div className="p-2 bg-primary/10 rounded-full">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary tabular-nums">{totalPrograms}</div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md motion-safe:transition-shadow bg-card animate-fade-in-up stagger-3">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Lớp học đang mở</CardTitle>
          <div className="p-2 bg-primary/10 rounded-full">
            <School className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary tabular-nums">{activeClasses}</div>
        </CardContent>
      </Card>
      <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md motion-safe:transition-shadow bg-card animate-fade-in-up stagger-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Thanh toán chờ xử lý</CardTitle>
          <div className="p-2 bg-amber-500/10 rounded-full">
            <Wallet className="h-4 w-4 text-amber-500" aria-hidden="true" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-500 tabular-nums">{pendingPayments}</div>
        </CardContent>
      </Card>
    </div>
  );
}

async function RecentEnrollmentsSection() {
  const recentEnrollments = await getRecentEnrollments();

  return (
    <Card className="md:col-span-1 lg:col-span-4 shadow-sm animate-fade-in-up stagger-5">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <CardTitle className="text-lg font-semibold text-primary">Ghi danh gần đây</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-0 divide-y">
          {recentEnrollments.map((enrollment) => (
            <div key={enrollment.id} className="flex items-center py-4 first:pt-0 last:pb-0">
              <div className="ml-4 space-y-1 min-w-0">
                <p className="text-sm font-medium leading-none text-foreground truncate">{enrollment.studentName}</p>
                <p className="text-sm text-muted-foreground">
                  Lớp: {enrollment.className} - {formatDate(enrollment.date)}
                </p>
              </div>
              <div className="ml-auto font-medium">
                <Badge variant={enrollment.status === "enrolled" ? "default" : "secondary"} className={enrollment.status === "enrolled" ? "bg-primary/10 text-primary hover:bg-primary/20 border-0" : ""}>
                  {enrollment.status === "enrolled" ? "Đang học" : enrollment.status === "pending" ? "Chờ duyệt" : enrollment.status === "completed" ? "Hoàn thành" : enrollment.status === "dropped" ? "Đã hủy" : enrollment.status}
                </Badge>
              </div>
            </div>
          ))}
          {recentEnrollments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Không có dữ liệu</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

async function RecentPaymentsSection() {
  const recentPayments = await getRecentPayments();

  return (
    <Card className="md:col-span-1 lg:col-span-3 shadow-sm animate-fade-in-up stagger-5">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <CardTitle className="text-lg font-semibold text-primary">Thanh toán gần đây</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-0 divide-y">
          {recentPayments.map((payment) => (
            <div key={payment.id} className="flex items-center py-4 first:pt-0 last:pb-0">
              <div className="ml-4 space-y-1 min-w-0">
                <p className="text-sm font-medium leading-none text-foreground truncate">{payment.studentName}</p>
                <p className="text-sm text-muted-foreground">{formatDate(payment.date)}</p>
              </div>
              <div className="ml-auto font-medium flex flex-col items-end gap-1">
                <span className="font-semibold text-amber-600 dark:text-amber-500 tabular-nums">{formatCurrency(payment.amount || 0)}</span>
                <Badge variant={payment.status === "completed" ? "default" : payment.status === "pending" ? "outline" : "destructive"} className={payment.status === "completed" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border-0" : payment.status === "pending" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border-0" : ""}>
                  {payment.status === "completed" ? "Hoàn thành" : payment.status === "pending" ? "Chờ xử lý" : "Thất bại"}
                </Badge>
              </div>
            </div>
          ))}
          {recentPayments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Không có dữ liệu</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  await requireAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
        <h1 className="text-lg font-semibold text-primary">Chào mừng bạn đến với Hệ thống Quản lý Đào tạo</h1>
        <p className="text-sm text-muted-foreground mt-1">Theo dõi và quản lý các hoạt động đào tạo, học vụ và tài chính.</p>
      </div>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-primary">Tổng quan</h2>
      </div>
      <Suspense fallback={<LoadingSkeleton />}>
        <DashboardStatsCards />
      </Suspense>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Suspense fallback={<LoadingSkeleton />}>
          <RecentEnrollmentsSection />
        </Suspense>
        <Suspense fallback={<LoadingSkeleton />}>
          <RecentPaymentsSection />
        </Suspense>
      </div>
    </div>
  );
}

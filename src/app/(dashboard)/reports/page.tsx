import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import { getReportStats, getProgramStats, getRecentCompletedPayments } from "@/lib/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Users, BarChart3, Wallet, Award, BookOpen, CreditCard } from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-64 bg-muted rounded" />
    </div>
  );
}

const formatCurrency = (amount: number | string | null) => {
  if (amount === null || amount === undefined) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(amount));
};

async function ReportStatsSection() {
  const { totalStudents, totalRevenue, totalCerts, completionRate } = await getReportStats();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Tổng sinh viên" value={totalStudents} icon={Users} color="primary" className="animate-fade-in-up stagger-1" />
      <StatCard title="Tỷ lệ hoàn thành" value={`${completionRate}%`} icon={BarChart3} color="blue" className="animate-fade-in-up stagger-2" />
      <StatCard title="Doanh thu" value={formatCurrency(totalRevenue)} icon={Wallet} color="emerald" className="animate-fade-in-up stagger-3" />
      <StatCard title="Văn bằng đã cấp" value={totalCerts} icon={Award} color="purple" className="animate-fade-in-up stagger-4" />
    </div>
  );
}

async function ReportTablesSection() {
  const [programStats, recentPayments] = await Promise.all([
    getProgramStats(),
    getRecentCompletedPayments(),
  ]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Thống kê theo chương trình</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chương trình</TableHead>
                <TableHead className="text-right">Sinh viên</TableHead>
                <TableHead className="text-right">Doanh thu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programStats.map((prog) => (
                <TableRow key={prog.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{prog.name}</TableCell>
                  <TableCell className="text-right tabular-nums">{prog.studentCount}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(prog.revenue)}</TableCell>
                </TableRow>
              ))}
              {programStats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="p-0">
                    <EmptyState icon={BookOpen} title="Chưa có dữ liệu chương trình" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thanh toán gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sinh viên</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Ngày</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium max-w-[160px] truncate">{payment.studentName}</TableCell>
                  <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell className="tabular-nums">
                    {payment.paidAt
                      ? format(new Date(payment.paidAt), "dd/MM/yyyy", { locale: vi })
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
              {recentPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="p-0">
                    <EmptyState icon={CreditCard} title="Chưa có giao dịch" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ReportsPage() {
  await requireRole(["admin", "staff"]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Báo cáo & Thống kê" description="Tổng quan về hoạt động của hệ thống" />

      <Suspense fallback={<LoadingSkeleton />}>
        <ReportStatsSection />
      </Suspense>

      <Suspense fallback={<LoadingSkeleton />}>
        <ReportTablesSection />
      </Suspense>
    </div>
  );
}

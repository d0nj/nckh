import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import { getPaymentsList, getDebtsList } from "@/lib/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CreatePaymentDialog, CreateDebtDialog, DebtStatusAction } from "./finance-actions";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Wallet, Clock, CheckCircle, RotateCcw, CreditCard, Receipt } from "lucide-react";

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

const methodLabels: Record<string, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  credit_card: "Thẻ tín dụng",
  e_wallet: "Ví điện tử",
  online: "Online",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Chờ xử lý",
  completed: "Hoàn thành",
  failed: "Thất bại",
  refunded: "Hoàn trả",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failed: "bg-red-500/10 text-red-600 dark:text-red-400",
  refunded: "bg-muted text-muted-foreground",
};

const debtStatusLabels: Record<string, string> = {
  active: "Đang nợ",
  paid: "Đã thanh toán",
  overdue: "Quá hạn",
  waived: "Miễn giảm",
};

const debtStatusColors: Record<string, string> = {
  active: "bg-red-500/10 text-red-600 dark:text-red-400",
  overdue: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  waived: "bg-muted text-muted-foreground",
};

async function FinanceStatsSection() {
  const paymentsList = await getPaymentsList();

  const totalRevenue = paymentsList
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingAmount = paymentsList
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const completedCount = paymentsList.filter((p) => p.status === "completed").length;
  const refundedCount = paymentsList.filter((p) => p.status === "refunded").length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Tổng thu" value={formatCurrency(totalRevenue)} icon={Wallet} color="emerald" className="animate-fade-in-up stagger-1" />
      <StatCard title="Chờ thanh toán" value={formatCurrency(pendingAmount)} icon={Clock} color="amber" className="animate-fade-in-up stagger-2" />
      <StatCard title="Đã hoàn thành" value={`${completedCount} giao dịch`} icon={CheckCircle} color="primary" className="animate-fade-in-up stagger-3" />
      <StatCard title="Hoàn trả" value={`${refundedCount} giao dịch`} icon={RotateCcw} color="blue" className="animate-fade-in-up stagger-4" />
    </div>
  );
}

async function PaymentsTable() {
  const paymentsList = await getPaymentsList();

  return (
    <TabsContent value="payments" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử thanh toán</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sinh viên</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Phương thức</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày thanh toán</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentsList.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{payment.studentName}</TableCell>
                  <TableCell className="tabular-nums">{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{payment.type}</TableCell>
                  <TableCell>{methodLabels[payment.method || ""] || payment.method}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={paymentStatusColors[payment.status || ""]}>
                      {paymentStatusLabels[payment.status || ""] || payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {payment.paymentDate
                      ? format(new Date(payment.paymentDate), "dd/MM/yyyy HH:mm", { locale: vi })
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
              {paymentsList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={CreditCard}
                      title="Chưa có giao dịch"
                      description="Các giao dịch thanh toán sẽ hiển thị tại đây."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

async function DebtsTable() {
  const debtsList = await getDebtsList();

  return (
    <TabsContent value="debts" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Danh sách công nợ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                 <TableHead>Sinh viên</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Còn lại</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Hạn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {debtsList.map((debt) => (
                <TableRow key={debt.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{debt.studentName}</TableCell>
                  <TableCell className="tabular-nums">{formatCurrency(debt.amount)}</TableCell>
                  <TableCell className="text-red-600 dark:text-red-400 font-medium tabular-nums">{formatCurrency(debt.remaining)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{debt.reason}</TableCell>
                  <TableCell className="tabular-nums">
                    {debt.dueDate ? format(new Date(debt.dueDate), "dd/MM/yyyy", { locale: vi }) : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={debtStatusColors[debt.status || ""]}>
                      {debtStatusLabels[debt.status || ""] || debt.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(debt.status === "active" || debt.status === "overdue") && (
                      <DebtStatusAction debtId={debt.id} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
               {debtsList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={Receipt}
                      title="Không có công nợ"
                      description="Hiện tại không có khoản công nợ nào cần theo dõi."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </TabsContent>
  );
}

export default async function FinancePage() {
  await requireRole(["admin", "staff"]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Quản lý Tài chính" description="Theo dõi thanh toán và công nợ sinh viên">
        <CreateDebtDialog />
        <CreatePaymentDialog />
      </PageHeader>

      <Suspense fallback={<LoadingSkeleton />}>
        <FinanceStatsSection />
      </Suspense>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Thanh toán</TabsTrigger>
          <TabsTrigger value="debts">Công nợ</TabsTrigger>
        </TabsList>

        <Suspense fallback={<LoadingSkeleton />}>
          <PaymentsTable />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton />}>
          <DebtsTable />
        </Suspense>
      </Tabs>
    </div>
  );
}

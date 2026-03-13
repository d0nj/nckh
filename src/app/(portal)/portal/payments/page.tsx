import { Suspense } from "react";
import { requireAuth } from "@/lib/session";
import { getStudentPaymentsAndDebts } from "@/lib/cache";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Wallet,
  Clock,
  AlertCircle,
  CreditCard,
  Receipt,
} from "lucide-react";
import { PayDebtButton } from "./pay-button";

const formatVND = (amount: number | string | null) => {
  if (amount === null || amount === undefined) return "0 ₫";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(num);
};

const PAYMENT_METHODS: Record<string, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  credit_card: "Thẻ tín dụng",
  e_wallet: "Ví điện tử",
  online: "Online",
};

const PAYMENT_TYPES: Record<string, string> = {
  tuition: "Học phí",
  exam_fee: "Phí thi",
  certificate_fee: "Phí cấp bằng",
  other: "Khác",
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15" },
  completed: { label: "Đã thanh toán", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15" },
  failed: { label: "Thất bại", color: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/15" },
  refunded: { label: "Hoàn tiền", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:bg-orange-500/15" },
};

const DEBT_STATUS: Record<string, { label: string; color: string }> = {
  active: { label: "Đang nợ", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15" },
  paid: { label: "Đã trả", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15" },
  overdue: { label: "Quá hạn", color: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/15" },
  waived: { label: "Miễn giảm", color: "bg-muted text-muted-foreground hover:bg-muted" },
};

async function PaymentsContent({ userId }: { userId: string }) {
  const { userPayments, userDebts } = await getStudentPaymentsAndDebts(userId);

  const totalPaid = userPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalPending = userPayments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalDebt = userDebts
    .filter((d) => d.status === "active" || d.status === "overdue")
    .reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0);

  const overdueCount = userDebts.filter((d) => d.status === "overdue").length;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đã đóng</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatVND(totalPaid)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang chờ</CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {formatVND(totalPending)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Công nợ</CardTitle>
            <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {formatVND(totalDebt)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quá hạn</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">
              {overdueCount} khoản
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Lịch sử thanh toán */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
              Lịch sử thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Chưa có lịch sử thanh toán nào.
              </p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Phương thức</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userPayments.map((payment) => {
                      const statusInfo =
                        PAYMENT_STATUS[payment.status || "pending"] ||
                        PAYMENT_STATUS.pending;
                      const isCompleted = payment.status === "completed";

                      return (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium truncate max-w-[200px]">
                            {payment.description ||
                              PAYMENT_TYPES[payment.type || "other"] ||
                              "Khác"}
                          </TableCell>
                          <TableCell
                            className={
                              isCompleted ? "text-emerald-600 dark:text-emerald-400 font-medium tabular-nums" : "tabular-nums"
                            }
                          >
                            {formatVND(payment.amount)}
                          </TableCell>
                          <TableCell>
                            {PAYMENT_METHODS[payment.method || "cash"] ||
                              "Khác"}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {payment.paidAt || payment.createdAt
                              ? format(
                                  new Date(
                                    (payment.paidAt || payment.createdAt)!
                                  ),
                                  "dd/MM/yyyy",
                                  { locale: vi }
                                )
                              : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={statusInfo.color}
                            >
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Công nợ */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" aria-hidden="true" />
              Công nợ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {userDebts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Bạn không có khoản công nợ nào.
              </p>
            ) : (
              userDebts.map((debt, index) => {
                const statusInfo =
                  DEBT_STATUS[debt.status || "active"] || DEBT_STATUS.active;

                return (
                  <div key={debt.id}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium leading-none truncate">
                          {debt.reason || "Khoản nợ"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Hạn chót:{" "}
                          {debt.dueDate
                            ? format(new Date(debt.dueDate), "dd/MM/yyyy", {
                                locale: vi,
                              })
                            : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1">
                        <div className="text-right">
                          <p className="font-bold text-lg tabular-nums">
                            {formatVND(debt.remainingAmount)}
                          </p>
                          {Number(debt.remainingAmount) !==
                            Number(debt.amount) && (
                            <p className="text-xs text-muted-foreground line-through tabular-nums">
                              {formatVND(debt.amount)}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className={statusInfo.color}
                        >
                          {statusInfo.label}
                        </Badge>
                        {(debt.status === "active" ||
                          debt.status === "overdue") && (
                          <PayDebtButton
                            debtId={debt.id}
                            amount={Number(debt.remainingAmount) || 0}
                            reason={debt.reason || "Khoản nợ"}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default async function PaymentsPage() {
  const session = await requireAuth();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Học phí & Công nợ</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý thông tin thanh toán và các khoản phí cần đóng.
        </p>
      </div>

      <Suspense fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      }>
        <PaymentsContent userId={session.user.id} />
      </Suspense>
    </div>
  );
}

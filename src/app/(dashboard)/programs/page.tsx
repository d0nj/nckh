import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import { getProgramsList } from "@/lib/cache";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-64 bg-muted rounded" />
    </div>
  );
}

const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === undefined) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case "active":
      return <Badge className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">Hoạt động</Badge>;
    case "inactive":
      return <Badge variant="destructive">Ngừng hoạt động</Badge>;
    case "draft":
      return <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-600 dark:border-amber-400">Bản nháp</Badge>;
    default:
      return <Badge variant="secondary">Không rõ</Badge>;
  }
};

const getTypeBadge = (type: string | null) => {
  switch (type) {
    case "diploma":
      return <Badge variant="secondary">Chính quy</Badge>;
    case "certificate":
      return <Badge variant="secondary">Chứng chỉ</Badge>;
    case "short_term":
      return <Badge variant="secondary">Ngắn hạn</Badge>;
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
};

async function ProgramsTable() {
  const programsList = await getProgramsList();

  return (
    <div className="rounded-md border overflow-x-auto animate-fade-in-up stagger-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã</TableHead>
            <TableHead>Tên chương trình</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Thời lượng</TableHead>
            <TableHead>Số tín chỉ</TableHead>
            <TableHead>Học phí</TableHead>
            <TableHead>Số môn học</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {programsList.map((program) => (
            <TableRow key={program.id}>
              <TableCell className="font-medium">{program.code}</TableCell>
              <TableCell className="max-w-[250px] truncate">{program.name}</TableCell>
              <TableCell>{getTypeBadge(program.type)}</TableCell>
              <TableCell className="tabular-nums">{program.duration} giờ</TableCell>
              <TableCell className="tabular-nums">{program.credits}</TableCell>
              <TableCell className="tabular-nums">{formatCurrency(program.tuitionFee)}</TableCell>
              <TableCell className="tabular-nums">{program.courseCount}</TableCell>
              <TableCell>{getStatusBadge(program.status)}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" render={<Link href={`/programs/${program.id}`} />}>Chi tiết</Button>
              </TableCell>
            </TableRow>
          ))}
          {programsList.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="p-0">
                <EmptyState
                  icon={BookOpen}
                  title="Chưa có chương trình đào tạo"
                  description="Bắt đầu bằng cách thêm chương trình đào tạo đầu tiên."
                  action={
                    <Button size="sm" render={<Link href="/programs/new" />}><Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Thêm chương trình</Button>
                  }
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function ProgramsPage() {
  await requireRole(["admin", "staff"]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Chương trình đào tạo" description="Quản lý các chương trình đào tạo của hệ thống">
        <Button render={<Link href="/programs/new" />}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Thêm chương trình
          </Button>
      </PageHeader>

      <Suspense fallback={<LoadingSkeleton />}>
        <ProgramsTable />
      </Suspense>
    </div>
  );
}

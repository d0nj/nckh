import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import { getStudentsList } from "@/lib/cache";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Users } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-64 bg-muted rounded" />
    </div>
  );
}

const formatDate = (date: string | null) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(date));
};

async function StudentsTable({ q, limit, offset }: { q: string; limit: number; offset: number }) {
  const studentsList = await getStudentsList(q, limit, offset);

  return (
    <div className="rounded-md border overflow-x-auto animate-fade-in-up stagger-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã SV</TableHead>
            <TableHead>Họ tên</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Điện thoại</TableHead>
            <TableHead>Ngày nhập học</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studentsList.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.studentCode || "N/A"}</TableCell>
              <TableCell className="max-w-[200px] truncate">{student.name}</TableCell>
              <TableCell className="max-w-[200px] truncate">{student.email}</TableCell>
              <TableCell className="tabular-nums">{student.phone || "N/A"}</TableCell>
              <TableCell className="tabular-nums">{formatDate(student.enrollmentDate as string | null)}</TableCell>
              <TableCell>
                {student.studentCode ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">Đang học</Badge>
                ) : (
                  <Badge variant="outline">Chưa rõ</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" render={<Link href={"/students/" + student.id} />}>Chi tiết</Button>
              </TableCell>
            </TableRow>
          ))}
          {studentsList.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="p-0">
                <EmptyState
                  icon={Users}
                  title="Không tìm thấy học viên"
                  description={q ? `Không có kết quả cho "${q}". Thử từ khóa khác.` : "Chưa có học viên nào trong hệ thống."}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireRole(["admin", "staff"]);
  const { q = "", page = "1" } = await searchParams;

  const pageNumber = parseInt(page) || 1;
  const limit = 20;
  const offset = (pageNumber - 1) * limit;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Quản lý học viên" description="Theo dõi và quản lý thông tin học viên" />
      
      <div className="flex items-center space-x-2">
        <form className="flex w-full max-w-sm items-center space-x-2">
          <label htmlFor="student-search" className="sr-only">Tìm kiếm học viên</label>
          <Input type="text" name="q" id="student-search" placeholder="Tìm kiếm theo tên, email, mã SV…" defaultValue={q} autoComplete="off" spellCheck={false} />
          <Button type="submit" size="icon" aria-label="Tìm kiếm">
            <Search className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <StudentsTable q={q} limit={limit} offset={offset} />
      </Suspense>
    </div>
  );
}

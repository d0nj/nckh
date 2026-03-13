import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import { getExamsList, getGradesList } from "@/lib/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList, GraduationCap } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-64 bg-muted rounded" />
    </div>
  );
}

const examTypeLabels: Record<string, string> = {
  midterm: "Giữa kỳ",
  final: "Cuối kỳ",
  quiz: "Kiểm tra",
  assignment: "Bài tập",
  practical: "Thực hành",
};

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  ongoing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  scheduled: "Sắp diễn ra",
  ongoing: "Đang diễn ra",
  completed: "Đã kết thúc",
  cancelled: "Đã hủy",
};

async function ExamsTable() {
  const examsList = await getExamsList();

  return (
    <TabsContent value="exams" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Danh sách lịch thi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên bài thi</TableHead>
                <TableHead>Lớp</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Ngày thi</TableHead>
                <TableHead>Phòng</TableHead>
                <TableHead>Thời gian</TableHead>
                 <TableHead>Trạng thái</TableHead>
                 <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {examsList.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{exam.name}</TableCell>
                  <TableCell className="max-w-[160px] truncate">{exam.className}</TableCell>
                  <TableCell>{examTypeLabels[exam.type || ""] || exam.type}</TableCell>
                  <TableCell className="tabular-nums">
                    {exam.date ? format(new Date(exam.date), "dd/MM/yyyy", { locale: vi }) : "Chưa xếp"}
                  </TableCell>
                  <TableCell>{exam.room}</TableCell>
                  <TableCell className="tabular-nums">{exam.duration} phút</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[exam.status || ""]}>
                      {statusLabels[exam.status || ""] || exam.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" render={<Link href={`/exams/${exam.id}`} />}>Chi tiết</Button>
                  </TableCell>
                </TableRow>
              ))}
              {examsList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState
                      icon={ClipboardList}
                      title="Chưa có lịch thi"
                      description="Tạo bài thi mới để lên lịch cho sinh viên."
                      action={
                        <Button size="sm" render={<Link href="/exams/new" />}><Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Thêm bài thi</Button>
                      }
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

async function GradesTable() {
  const gradesList = await getGradesList();

  return (
    <TabsContent value="grades" className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Bảng điểm sinh viên</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sinh viên</TableHead>
                <TableHead>Bài thi</TableHead>
                <TableHead>Điểm số</TableHead>
                <TableHead>Xếp loại</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gradesList.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{grade.studentName}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{grade.examName}</TableCell>
                  <TableCell className="tabular-nums">{grade.score}</TableCell>
                  <TableCell>{grade.classification}</TableCell>
                  <TableCell>
                    <Badge variant={grade.status === "finalized" ? "default" : "secondary"}>
                      {grade.status === "finalized" ? "Đã công bố" : grade.status === "graded" ? "Đã chấm" : grade.status === "appealed" ? "Khiếu nại" : "Chờ chấm"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {gradesList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={GraduationCap}
                      title="Chưa có dữ liệu điểm"
                      description="Điểm sẽ hiển thị sau khi giảng viên chấm bài."
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

export default async function ExamsPage() {
  await requireRole(["admin", "staff", "lecturer"]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Quản lý Thi & Điểm" description="Quản lý lịch thi và bảng điểm sinh viên">
        <Button render={<Link href="/exams/new" />}><Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Thêm bài thi</Button>
      </PageHeader>

      <Tabs defaultValue="exams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="exams">Lịch thi</TabsTrigger>
          <TabsTrigger value="grades">Bảng điểm</TabsTrigger>
        </TabsList>

        <Suspense fallback={<LoadingSkeleton />}>
          <ExamsTable />
        </Suspense>

        <Suspense fallback={<LoadingSkeleton />}>
          <GradesTable />
        </Suspense>
      </Tabs>
    </div>
  );
}

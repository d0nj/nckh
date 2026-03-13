import { Suspense } from "react";
import { requireAuth } from "@/lib/session";
import { getStudentGrades } from "@/lib/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { BookOpen, CheckCircle, Clock } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

const EXAM_TYPE_LABELS: Record<string, string> = {
  midterm: "Giữa kỳ",
  final: "Cuối kỳ",
  quiz: "Kiểm tra",
  assignment: "Bài tập",
  practical: "Thực hành",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ chấm",
  graded: "Đã chấm",
  appealed: "Đang phúc khảo",
  finalized: "Đã công bố",
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  graded: "default",
  appealed: "destructive",
  finalized: "outline",
};

async function GradesContent({ userId }: { userId: string }) {
  const studentGrades = await getStudentGrades(userId);

  let totalScore = 0;
  let gradedCount = 0;
  let pendingCount = 0;

  studentGrades.forEach(({ grade }) => {
    if (grade.status === "graded" || grade.status === "finalized") {
      if (grade.score !== null) {
        totalScore += Number(grade.score);
        gradedCount++;
      }
    } else if (grade.status === "pending") {
      pendingCount++;
    }
  });

  const averageScore = gradedCount > 0 ? (totalScore / gradedCount).toFixed(2) : "0.00";

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{averageScore}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số môn đã có điểm</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{gradedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang chờ chấm</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết điểm số</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Môn học</TableHead>
                <TableHead>Bài thi</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Trọng số</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Xếp loại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày chấm</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentGrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <EmptyState
                      icon={BookOpen}
                      title="Chưa có dữ liệu điểm"
                      description="Điểm sẽ hiển thị khi giảng viên hoàn thành chấm bài."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                studentGrades.map(({ grade, exam, course }) => (
                  <TableRow key={grade.id}>
                    <TableCell className="font-medium truncate max-w-[200px]">{course.name}</TableCell>
                    <TableCell className="truncate max-w-[200px]">{exam.name}</TableCell>
                    <TableCell>{EXAM_TYPE_LABELS[exam.type] || exam.type}</TableCell>
                    <TableCell className="tabular-nums">{exam.weight}%</TableCell>
                    <TableCell className="tabular-nums">
                      {grade.score !== null ? `${grade.score} / ${exam.maxScore}` : "-"}
                    </TableCell>
                    <TableCell>{grade.letterGrade || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_COLORS[grade.status] || "default"}
                        className={
                          grade.status === "pending"
                            ? "bg-amber-500 hover:bg-amber-600 text-white"
                            : grade.status === "appealed"
                            ? "bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white"
                            : grade.status === "finalized"
                            ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white"
                            : ""
                        }
                      >
                        {STATUS_LABELS[grade.status] || grade.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {grade.gradedAt
                        ? format(new Date(grade.gradedAt), "dd/MM/yyyy", { locale: vi })
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

export default async function GradesPage() {
  const session = await requireAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bảng điểm</h1>
        <p className="text-muted-foreground">Kết quả học tập của bạn</p>
      </div>

      <Suspense fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      }>
        <GradesContent userId={session.user.id} />
      </Suspense>
    </div>
  );
}

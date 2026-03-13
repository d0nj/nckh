import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import { db } from "@/db";
import { exams, grades, classes, courses, user, enrollments } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, Scale, CheckCircle, BarChart3 } from "lucide-react";
import Link from "next/link";
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

async function ExamDetailContent({ id }: { id: string }) {
  const exam = await db.select().from(exams).where(eq(exams.id, id)).get();
  if (!exam) notFound();

  // Fetch all exam details in parallel
  const [classAndCourse, gradesList, enrolledStudents] = await Promise.all([
    db.select({
      className: classes.name,
      classCode: classes.code,
      courseId: classes.courseId,
      courseName: courses.name,
    }).from(classes)
      .leftJoin(courses, eq(classes.courseId, courses.id))
      .where(eq(classes.id, exam.classId))
      .get(),

    db.select({
      id: grades.id,
      studentId: grades.studentId,
      score: grades.score,
      letterGrade: grades.letterGrade,
      status: grades.status,
      gradedAt: grades.gradedAt,
      note: grades.note,
      studentName: user.name,
      studentEmail: user.email,
    }).from(grades)
      .leftJoin(user, eq(grades.studentId, user.id))
      .where(eq(grades.examId, id))
      .orderBy(user.name),

    db.select({
      studentId: enrollments.studentId,
      studentName: user.name,
      studentEmail: user.email,
    }).from(enrollments)
      .leftJoin(user, eq(enrollments.studentId, user.id))
      .where(eq(enrollments.classId, exam.classId)),
  ]);

  const classInfo = classAndCourse ? { name: classAndCourse.className, code: classAndCourse.classCode, courseId: classAndCourse.courseId } : null;
  const courseInfo = classAndCourse ? { name: classAndCourse.courseName } : null;

  // Compute stats from gradesList
  const gradedGrades = gradesList.filter((g) => g.score !== null);
  const gradedCount = gradedGrades.length;
  const totalEnrolled = enrolledStudents.length;
  const averageScore =
    gradedCount > 0
      ? gradedGrades.reduce((sum, g) => sum + (g.score || 0), 0) / gradedCount
      : 0;

  // Find students without grades
  const gradedStudentIds = new Set(gradesList.map((g) => g.studentId));
  const ungradedStudents = enrolledStudents.filter(
    (s) => !gradedStudentIds.has(s.studentId)
  );

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—";
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: vi });
    } catch {
      return date;
    }
  };

  const examTypeLabels: Record<string, string> = {
    midterm: "Giữa kỳ",
    final: "Cuối kỳ",
    quiz: "Kiểm tra",
    assignment: "Bài tập",
    practical: "Thực hành",
  };

  const examStatusLabels: Record<string, string> = {
    scheduled: "Sắp diễn ra",
    in_progress: "Đang thi",
    completed: "Đã kết thúc",
    cancelled: "Đã hủy",
  };

  const gradeStatusLabels: Record<string, string> = {
    pending: "Chờ chấm",
    graded: "Đã chấm",
    appealed: "Khiếu nại",
    finalized: "Đã công bố",
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/exams" />} aria-label="Quay lại">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{exam.name}</h2>
            <p className="text-muted-foreground">
              Lớp: {classInfo?.code} - {classInfo?.name} · Môn:{" "}
              {courseInfo?.name || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm tối đa</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{exam.maxScore}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trọng số</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{exam.weight}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã chấm</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {gradedCount}/{totalEnrolled}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm TB</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {averageScore > 0 ? averageScore.toFixed(1) : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="grades">
            Bảng điểm ({gradesList.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết bài thi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Tên bài thi
                  </span>
                  <p className="font-medium">{exam.name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Loại</span>
                  <p className="font-medium">
                    {examTypeLabels[exam.type] || exam.type}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Ngày thi
                  </span>
                  <p className="font-medium">{formatDate(exam.examDate)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Giờ bắt đầu
                  </span>
                  <p className="font-medium">{exam.startTime || "—"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Giờ kết thúc
                  </span>
                  <p className="font-medium">{exam.endTime || "—"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Phòng</span>
                  <p className="font-medium">{exam.room || "—"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Thời gian
                  </span>
                  <p className="font-medium">
                    {exam.duration ? `${exam.duration} phút` : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Điểm tối đa
                  </span>
                  <p className="font-medium">{exam.maxScore}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Trọng số
                  </span>
                  <p className="font-medium">{exam.weight}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Trạng thái
                  </span>
                  <p className="font-medium">
                    <Badge variant="outline">
                      {examStatusLabels[exam.status] || exam.status}
                    </Badge>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>Bảng điểm</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ungradedStudents.length > 0 && (
                <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  {ungradedStudents.length} sinh viên chưa có điểm
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sinh viên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Xếp loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày chấm</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradesList.map((grade) => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium max-w-[180px] truncate">
                        {grade.studentName}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{grade.studentEmail}</TableCell>
                      <TableCell className="font-bold tabular-nums">
                        {grade.score ?? "—"}
                      </TableCell>
                      <TableCell>{grade.letterGrade || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {gradeStatusLabels[grade.status || ""] ||
                            grade.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{formatDate(grade.gradedAt)}</TableCell>
                      <TableCell>{grade.note || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {gradesList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Chưa có điểm nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "staff", "lecturer"]);
  const { id } = await params;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ExamDetailContent id={id} />
    </Suspense>
  );
}

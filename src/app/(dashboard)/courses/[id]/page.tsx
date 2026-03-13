import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import { db } from "@/db";
import { courses, classes, exams, programs, user, examBank, enrollments } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Clock, Users, GraduationCap } from "lucide-react";
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

async function CourseDetailContent({ id }: { id: string }) {
  const course = await db.select().from(courses).where(eq(courses.id, id)).get();
  if (!course) notFound();

  // Fetch all course details in parallel
  const [program, classesList, examsList, examBankList, totalStudents] = await Promise.all([
    db.select({ name: programs.name }).from(programs).where(eq(programs.id, course.programId)).get(),

    db.select({
      id: classes.id,
      code: classes.code,
      name: classes.name,
      lecturerName: user.name,
      maxStudents: classes.maxStudents,
      currentStudents: classes.currentStudents,
      room: classes.room,
      startDate: classes.startDate,
      endDate: classes.endDate,
      status: classes.status,
    }).from(classes).leftJoin(user, eq(classes.lecturerId, user.id)).where(eq(classes.courseId, id)).orderBy(desc(classes.createdAt)),

    db.select({
      id: exams.id,
      name: exams.name,
      type: exams.type,
      examDate: exams.examDate,
      room: exams.room,
      duration: exams.duration,
      status: exams.status,
      className: classes.name,
    }).from(exams).innerJoin(classes, eq(exams.classId, classes.id)).where(eq(classes.courseId, id)).orderBy(desc(exams.examDate)),

    db.select().from(examBank).where(eq(examBank.courseId, id)).orderBy(desc(examBank.createdAt)),

    db.select({ count: sql<number>`count(distinct ${enrollments.studentId})` }).from(enrollments).innerJoin(classes, eq(enrollments.classId, classes.id)).where(eq(classes.courseId, id)).get(),
  ]);

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—";
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: vi });
    } catch {
      return date;
    }
  };

  const classStatusLabels: Record<string, string> = {
    open: "Mở",
    in_progress: "Đang học",
    completed: "Kết thúc",
    cancelled: "Hủy",
    closed: "Đóng",
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

  const examBankTypeLabels: Record<string, string> = {
    multiple_choice: "Trắc nghiệm",
    essay: "Tự luận",
    practical: "Thực hành",
    mixed: "Hỗn hợp",
  };

  const difficultyLabels: Record<string, string> = {
    easy: "Dễ",
    medium: "Trung bình",
    hard: "Khó",
  };

  const courseStatusLabels: Record<string, string> = {
    active: "Hoạt động",
    inactive: "Ngừng",
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/courses" />} aria-label="Quay lại">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{course.name}</h2>
            <p className="text-muted-foreground">
              Mã: {course.code} · Chương trình: {program?.name || "Không xác định"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tín chỉ</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{course.credits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số giờ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{course.hours}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số lớp</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{classesList.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Học viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{totalStudents?.count || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="classes">Lớp học ({classesList.length})</TabsTrigger>
          <TabsTrigger value="exams">Lịch thi ({examsList.length})</TabsTrigger>
          <TabsTrigger value="bank">Ngân hàng đề ({examBankList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết môn học</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Mã môn học</span>
                  <p className="font-medium">{course.code}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Chương trình</span>
                  <p className="font-medium">{program?.name || "—"}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Số tín chỉ</span>
                  <p className="font-medium">{course.credits}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Số giờ</span>
                  <p className="font-medium">{course.hours}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Thứ tự</span>
                  <p className="font-medium">{course.order}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Trạng thái</span>
                  <p className="font-medium">
                    <Badge variant={course.status === "active" ? "default" : "secondary"}>
                      {courseStatusLabels[course.status] || course.status}
                    </Badge>
                  </p>
                </div>
              </div>
              {course.description && (
                <div>
                  <span className="text-sm text-muted-foreground">Mô tả</span>
                  <p className="mt-1">{course.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách lớp học</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã lớp</TableHead>
                    <TableHead>Tên lớp</TableHead>
                    <TableHead>Giảng viên</TableHead>
                    <TableHead>Phòng</TableHead>
                    <TableHead>Sĩ số</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classesList.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.code}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{cls.name}</TableCell>
                      <TableCell className="max-w-[140px] truncate">{cls.lecturerName || "Chưa phân công"}</TableCell>
                      <TableCell>{cls.room || "Chưa xếp"}</TableCell>
                      <TableCell className="tabular-nums">
                        {cls.currentStudents}/{cls.maxStudents}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatDate(cls.startDate)} - {formatDate(cls.endDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {classStatusLabels[cls.status || ""] || cls.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {classesList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        Chưa có lớp học nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exams">
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
                      <TableCell className="font-medium max-w-[180px] truncate">{exam.name}</TableCell>
                      <TableCell className="max-w-[140px] truncate">{exam.className}</TableCell>
                      <TableCell>{examTypeLabels[exam.type || ""] || exam.type}</TableCell>
                      <TableCell className="tabular-nums">{formatDate(exam.examDate)}</TableCell>
                      <TableCell>{exam.room || "—"}</TableCell>
                      <TableCell className="tabular-nums">{exam.duration ? `${exam.duration} phút` : "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {examStatusLabels[exam.status || ""] || exam.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" render={<Link href={"/exams/" + exam.id} />}>Chi tiết</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {examsList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        Chưa có bài thi nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card>
            <CardHeader>
              <CardTitle>Ngân hàng đề thi</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tiêu đề</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Độ khó</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examBankList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{item.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {examBankTypeLabels[item.type || ""] || item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.difficulty === "hard"
                              ? "destructive"
                              : item.difficulty === "easy"
                                ? "outline"
                                : "secondary"
                          }
                        >
                          {difficultyLabels[item.difficulty || ""] || item.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{formatDate(item.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                  {examBankList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Chưa có đề thi nào.
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

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "staff", "lecturer"]);
  const { id } = await params;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CourseDetailContent id={id} />
    </Suspense>
  );
}

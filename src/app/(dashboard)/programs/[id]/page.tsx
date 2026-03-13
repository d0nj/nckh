import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import { db } from "@/db";
import { programs, courses, classes, enrollments, user } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Users, Clock, CreditCard } from "lucide-react";
import Link from "next/link";
import { ProgramActions } from "./actions";

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-64 bg-muted rounded" />
    </div>
  );
}

async function ProgramDetailContent({ id }: { id: string }) {
  const program = await db.select().from(programs).where(eq(programs.id, id)).get();
  if (!program) notFound();

  // Fetch program details in parallel
  const [coursesList, classesList, totalStudents] = await Promise.all([
    db.select({
      id: courses.id,
      code: courses.code,
      name: courses.name,
      credits: courses.credits,
      hours: courses.hours,
      order: courses.order,
      status: courses.status,
    }).from(courses).where(eq(courses.programId, id)).orderBy(courses.order),

    db.select({
      id: classes.id,
      code: classes.code,
      name: classes.name,
      courseName: courses.name,
      lecturerName: user.name,
      maxStudents: classes.maxStudents,
      currentStudents: classes.currentStudents,
      startDate: classes.startDate,
      endDate: classes.endDate,
      status: classes.status,
    }).from(classes).innerJoin(courses, eq(classes.courseId, courses.id)).leftJoin(user, eq(classes.lecturerId, user.id)).where(eq(courses.programId, id)).orderBy(desc(classes.createdAt)),

    db.select({ count: sql<number>`count(distinct ${enrollments.studentId})` }).from(enrollments).innerJoin(classes, eq(enrollments.classId, classes.id)).innerJoin(courses, eq(classes.courseId, courses.id)).where(eq(courses.programId, id)).get(),
  ]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const typeLabels: Record<string, string> = { short_term: "Ngắn hạn", certificate: "Chứng chỉ", diploma: "Chính quy" };
  const statusLabels: Record<string, string> = { active: "Hoạt động", inactive: "Ngừng", draft: "Bản nháp" };
  const classStatusLabels: Record<string, string> = { open: "Mở", in_progress: "Đang học", completed: "Kết thúc", cancelled: "Hủy", closed: "Đóng" };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/programs" />} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{program.name}</h2>
            <p className="text-muted-foreground">Mã: {program.code} · {typeLabels[program.type] || program.type}</p>
          </div>
        </div>
        <ProgramActions programId={program.id} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thời lượng</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">{program.durationHours} giờ</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số môn học</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">{coursesList.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Học viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">{totalStudents?.count || 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Học phí</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold tabular-nums">{formatCurrency(program.tuitionFee)}</div></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="courses">Môn học ({coursesList.length})</TabsTrigger>
          <TabsTrigger value="classes">Lớp học ({classesList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết chương trình</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">Mã chương trình</span><p className="font-medium">{program.code}</p></div>
                <div><span className="text-sm text-muted-foreground">Loại hình</span><p className="font-medium">{typeLabels[program.type]}</p></div>
                <div><span className="text-sm text-muted-foreground">Thời lượng</span><p className="font-medium">{program.durationHours} giờ</p></div>
                <div><span className="text-sm text-muted-foreground">Số tín chỉ</span><p className="font-medium">{program.totalCredits || 0}</p></div>
                <div><span className="text-sm text-muted-foreground">Học phí</span><p className="font-medium">{formatCurrency(program.tuitionFee)}</p></div>
                <div><span className="text-sm text-muted-foreground">Trạng thái</span><p className="font-medium">{statusLabels[program.status]}</p></div>
              </div>
              {program.description && (
                <div><span className="text-sm text-muted-foreground">Mô tả</span><p className="mt-1">{program.description}</p></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Danh sách môn học</CardTitle>
              <Button size="sm" render={<Link href={"/courses/new?programId=" + id} />}>Thêm môn học</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>STT</TableHead>
                    <TableHead>Mã môn</TableHead>
                    <TableHead>Tên môn học</TableHead>
                    <TableHead>Tín chỉ</TableHead>
                    <TableHead>Số giờ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coursesList.map((course, i) => (
                    <TableRow key={course.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-medium">{course.code}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{course.name}</TableCell>
                      <TableCell className="tabular-nums">{course.credits}</TableCell>
                      <TableCell className="tabular-nums">{course.hours}</TableCell>
                      <TableCell>
                        <Badge variant={course.status === "active" ? "default" : "secondary"}>
                          {course.status === "active" ? "Hoạt động" : "Ngừng"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" render={<Link href={"/courses/" + course.id} />}>Chi tiết</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {coursesList.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center">Chưa có môn học nào.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader><CardTitle>Lớp học trong chương trình</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã lớp</TableHead>
                    <TableHead>Tên lớp</TableHead>
                    <TableHead>Môn học</TableHead>
                    <TableHead>Giảng viên</TableHead>
                    <TableHead>Sĩ số</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classesList.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.code}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{cls.name}</TableCell>
                      <TableCell className="max-w-[140px] truncate">{cls.courseName}</TableCell>
                      <TableCell className="max-w-[140px] truncate">{cls.lecturerName || "Chưa phân công"}</TableCell>
                      <TableCell className="tabular-nums">{cls.currentStudents}/{cls.maxStudents}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{classStatusLabels[cls.status || ""] || cls.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {classesList.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Chưa có lớp học nào.</TableCell></TableRow>
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

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "staff"]);
  const { id } = await params;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ProgramDetailContent id={id} />
    </Suspense>
  );
}

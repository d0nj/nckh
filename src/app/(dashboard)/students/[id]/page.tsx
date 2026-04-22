import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import { db } from "@/db";
import { user, studentProfiles, enrollments, classes, courses, grades, exams, payments, debts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, CreditCard } from "lucide-react";
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

async function StudentDetailContent({ id }: { id: string }) {
  const [student] = await db.select().from(user).where(eq(user.id, id)).limit(1);
  if (!student) notFound();

  // Fetch all student details in parallel
  const [profile, enrollmentsList, gradesList, paymentsList, debtsList] = await Promise.all([
    db.select().from(studentProfiles).where(eq(studentProfiles.userId, id)).limit(1).then(rows => rows[0]),

    db.select({
      id: enrollments.id,
      status: enrollments.status,
      enrolledAt: enrollments.enrolledAt,
      completedAt: enrollments.completedAt,
      note: enrollments.note,
      className: classes.name,
      classCode: classes.code,
      courseName: courses.name,
    }).from(enrollments).leftJoin(classes, eq(enrollments.classId, classes.id)).leftJoin(courses, eq(classes.courseId, courses.id)).where(eq(enrollments.studentId, id)).orderBy(desc(enrollments.enrolledAt)),

    db.select({
      id: grades.id,
      score: grades.score,
      letterGrade: grades.letterGrade,
      status: grades.status,
      gradedAt: grades.gradedAt,
      note: grades.note,
      examName: exams.name,
      examType: exams.type,
      className: classes.name,
    }).from(grades).leftJoin(exams, eq(grades.examId, exams.id)).leftJoin(classes, eq(exams.classId, classes.id)).where(eq(grades.studentId, id)).orderBy(desc(grades.gradedAt)),

    db.select().from(payments).where(eq(payments.studentId, id)).orderBy(desc(payments.createdAt)),

    db.select().from(debts).where(eq(debts.studentId, id)).orderBy(desc(debts.createdAt)),
  ]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "—";
    try { return format(new Date(date), "dd/MM/yyyy", { locale: vi }); } catch { return date; }
  };

  const enrollmentStatusLabels: Record<string, string> = {
    pending: "Chờ duyệt", approved: "Đã duyệt", waitlisted: "Danh sách chờ",
    enrolled: "Đang học", completed: "Hoàn thành", dropped: "Bỏ học", rejected: "Từ chối",
  };

  const gradeStatusLabels: Record<string, string> = {
    pending: "Chờ chấm", graded: "Đã chấm", appealed: "Khiếu nại", finalized: "Đã công bố",
  };

  const examTypeLabels: Record<string, string> = {
    midterm: "Giữa kỳ", final: "Cuối kỳ", quiz: "Kiểm tra", assignment: "Bài tập", practical: "Thực hành",
  };

  const genderLabels: Record<string, string> = { male: "Nam", female: "Nữ", other: "Khác" };

  const paymentStatusLabels: Record<string, string> = { pending: "Chờ", completed: "Hoàn thành", failed: "Thất bại", refunded: "Hoàn trả" };
  const debtStatusLabels: Record<string, string> = { active: "Đang nợ", paid: "Đã trả", overdue: "Quá hạn", waived: "Miễn giảm" };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/students" />} aria-label="Quay lại"><ArrowLeft className="h-4 w-4" aria-hidden="true" /></Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{student.name}</h2>
          <p className="text-muted-foreground">{profile?.studentCode || "Chưa có mã SV"}</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
          <TabsTrigger value="enrollments">Đăng ký học ({enrollmentsList.length})</TabsTrigger>
          <TabsTrigger value="grades">Điểm số ({gradesList.length})</TabsTrigger>
          <TabsTrigger value="finance">Tài chính</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Thông tin cá nhân</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" /><span>{student.email}</span></div>
                <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" /><span>{student.phone || "Chưa cập nhật"}</span></div>
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" /><span>{student.address || "Chưa cập nhật"}</span></div>
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" /><span>{student.dateOfBirth || "Chưa cập nhật"}</span></div>
                <div><span className="text-sm text-muted-foreground">Giới tính: </span>{genderLabels[student.gender || ""] || "Chưa cập nhật"}</div>
                <div><span className="text-sm text-muted-foreground">CCCD: </span>{student.idNumber || "Chưa cập nhật"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Thông tin học vụ</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><span className="text-sm text-muted-foreground">Mã sinh viên: </span><span className="font-medium">{profile?.studentCode || "N/A"}</span></div>
                <div><span className="text-sm text-muted-foreground">Ngày nhập học: </span>{formatDate(profile?.enrollmentDate)}</div>
                <div><span className="text-sm text-muted-foreground">Liên hệ khẩn cấp: </span>{profile?.emergencyContact || "Chưa cập nhật"}</div>
                <div><span className="text-sm text-muted-foreground">SĐT khẩn cấp: </span>{profile?.emergencyPhone || "Chưa cập nhật"}</div>
                {profile?.notes && <div><span className="text-sm text-muted-foreground">Ghi chú: </span>{profile.notes}</div>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enrollments">
          <Card>
            <CardHeader><CardTitle>Lịch sử đăng ký học</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lớp</TableHead>
                    <TableHead>Môn học</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày đăng ký</TableHead>
                    <TableHead>Ngày hoàn thành</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollmentsList.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{e.classCode} - {e.className}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{e.courseName}</TableCell>
                      <TableCell><Badge variant="outline">{enrollmentStatusLabels[e.status || ""] || e.status}</Badge></TableCell>
                      <TableCell className="tabular-nums">{formatDate(e.enrolledAt)}</TableCell>
                      <TableCell className="tabular-nums">{formatDate(e.completedAt)}</TableCell>
                      <TableCell>{e.note || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {enrollmentsList.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center">Chưa có đăng ký nào.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades">
          <Card>
            <CardHeader><CardTitle>Bảng điểm</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bài thi</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Lớp</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Xếp loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày chấm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradesList.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium max-w-[180px] truncate">{g.examName}</TableCell>
                      <TableCell>{examTypeLabels[g.examType || ""] || g.examType}</TableCell>
                      <TableCell className="max-w-[140px] truncate">{g.className}</TableCell>
                      <TableCell className="font-bold tabular-nums">{g.score ?? "—"}</TableCell>
                      <TableCell>{g.letterGrade || "—"}</TableCell>
                      <TableCell><Badge variant="outline">{gradeStatusLabels[g.status || ""] || g.status}</Badge></TableCell>
                      <TableCell className="tabular-nums">{formatDate(g.gradedAt)}</TableCell>
                    </TableRow>
                  ))}
                  {gradesList.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center">Chưa có điểm nào.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Lịch sử thanh toán</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Phương thức</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsList.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium tabular-nums">{formatCurrency(p.amount)}</TableCell>
                        <TableCell>{p.type}</TableCell>
                        <TableCell>{p.method}</TableCell>
                        <TableCell><Badge variant="outline">{paymentStatusLabels[p.status || ""] || p.status}</Badge></TableCell>
                        <TableCell className="tabular-nums">{formatDate(p.paidAt || p.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                    {paymentsList.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="h-16 text-center">Chưa có thanh toán.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Công nợ</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Còn lại</TableHead>
                      <TableHead>Lý do</TableHead>
                      <TableHead>Hạn</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debtsList.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="tabular-nums">{formatCurrency(d.amount)}</TableCell>
                        <TableCell className="text-red-600 font-medium tabular-nums">{formatCurrency(d.remainingAmount)}</TableCell>
                        <TableCell>{d.reason}</TableCell>
                        <TableCell className="tabular-nums">{formatDate(d.dueDate)}</TableCell>
                        <TableCell><Badge variant="outline">{debtStatusLabels[d.status || ""] || d.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {debtsList.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="h-16 text-center">Không có công nợ.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "staff"]);
  const { id } = await params;

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <StudentDetailContent id={id} />
    </Suspense>
  );
}

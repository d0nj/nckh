import { Suspense } from "react";
import { requireAuth } from "@/lib/session";
import { getStudentProfile, getStudentDashboardData } from "@/lib/cache";
import { formatSchedule } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  BookOpen,
  GraduationCap,
  CreditCard,
  Bell,
  Calendar,
} from "lucide-react";

async function DashboardContent({ userId }: { userId: string }) {
  const data = await getStudentDashboardData(userId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md motion-safe:transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Môn đang học</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary tabular-nums">
              {data.enrolledCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md motion-safe:transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Điểm trung bình
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 tabular-nums">{data.avgScore}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md motion-safe:transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Công nợ</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-amber-600" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 tabular-nums">
              {formatCurrency(data.totalDebt)}
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md motion-safe:transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Thông báo chưa đọc
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Bell className="h-4 w-4 text-blue-600" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 tabular-nums">
              {data.unreadNotifications}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-1 lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Điểm số gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentGrades.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Chưa có điểm số nào được ghi nhận.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Môn học</TableHead>
                    <TableHead>Bài thi</TableHead>
                    <TableHead className="text-right">Điểm</TableHead>
                    <TableHead>Xếp loại</TableHead>
                    <TableHead className="text-right">Ngày chấm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentGrades.map((grade) => (
                    <TableRow key={grade.id} className="hover:bg-muted/50 motion-safe:transition-colors">
                      <TableCell className="font-medium truncate max-w-[200px]">
                        {grade.courseName}
                      </TableCell>
                      <TableCell className="truncate max-w-[200px]">{grade.examName}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {grade.score}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-background">{grade.letterGrade}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {grade.gradedAt
                          ? format(new Date(grade.gradedAt), "dd/MM/yyyy", {
                              locale: vi,
                            })
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-1 lg:col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Lịch học sắp tới</CardTitle>
          </CardHeader>
          <CardContent>
            {data.upcomingClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Không có lịch học nào sắp tới.
              </p>
            ) : (
              <div className="space-y-6">
                {data.upcomingClasses.map((cls) => (
                  <div key={cls.id} className="flex items-start p-3 rounded-lg hover:bg-muted/50 motion-safe:transition-colors border border-transparent hover:border-border">
                    <div className="mt-0.5 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div className="ml-4 space-y-1.5 flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-none text-foreground">
                        {cls.courseName}
                      </p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <span className="font-medium text-primary/80">Lớp:</span> <span className="ml-1">{cls.className}</span>
                        <span className="mx-2">•</span>
                        <span className="font-medium text-primary/80">Phòng:</span> <span className="ml-1">{cls.room}</span>
                      </div>
                      <p className="text-xs text-muted-foreground bg-muted inline-block px-2 py-1 rounded-md">
                        {formatSchedule(cls.schedule)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default async function StudentDashboardPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  // Profile check stays dynamic (depends on session)
  const profile = await getStudentProfile(userId);

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Không tìm thấy hồ sơ sinh viên.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 animate-fade-in">
      <div className="flex items-center justify-between space-y-2 bg-card p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-primary">
              Xin chào, {session.user.name}!
            </h2>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">MSSV: {profile.studentCode}</Badge>
              <span className="text-sm">Chào mừng bạn quay trở lại cổng thông tin.</span>
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      }>
        <DashboardContent userId={userId} />
      </Suspense>
    </div>
  );
}

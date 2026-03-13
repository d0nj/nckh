import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import { getCoursesList, getClassesList } from "@/lib/cache";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, School } from "lucide-react";
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

const getClassStatusBadge = (status: string | null) => {
  switch (status) {
    case "open":
      return <Badge className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">Mở đăng ký</Badge>;
    case "in_progress":
      return <Badge className="bg-amber-500 hover:bg-amber-600">Đang học</Badge>;
    case "completed":
      return <Badge className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">Đã kết thúc</Badge>;
    case "cancelled":
      return <Badge variant="destructive">Đã hủy</Badge>;
    default:
      return <Badge variant="outline">Chưa rõ</Badge>;
  }
};

const formatDate = (date: string | null) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(date));
};

async function CoursesTable() {
  const coursesList = await getCoursesList();

  return (
    <TabsContent value="courses" className="space-y-4">
      <div className="flex justify-end">
        <Button render={<Link href="/courses/new" />}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Thêm môn học
          </Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã môn</TableHead>
              <TableHead>Tên môn học</TableHead>
              <TableHead>Chương trình</TableHead>
              <TableHead>Số tín chỉ</TableHead>
              <TableHead>Số giờ</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coursesList.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.code}</TableCell>
                <TableCell className="max-w-[200px] truncate">{course.name}</TableCell>
                <TableCell className="max-w-[180px] truncate">{course.programName}</TableCell>
                <TableCell className="tabular-nums">{course.credits}</TableCell>
                <TableCell className="tabular-nums">{course.hours}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" render={<Link href={`/courses/${course.id}`} />}>Chi tiết</Button>
                </TableCell>
              </TableRow>
            ))}
            {coursesList.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={BookOpen}
                    title="Chưa có môn học"
                    description="Thêm môn học mới để bắt đầu xây dựng chương trình."
                    action={
                      <Button size="sm" render={<Link href="/courses/new" />}><Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Thêm môn học</Button>
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </TabsContent>
  );
}

async function ClassesTable() {
  const classesList = await getClassesList();

  return (
    <TabsContent value="classes" className="space-y-4">
      <div className="flex justify-end">
        <Button>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Thêm lớp học
        </Button>
      </div>
      <div className="rounded-md border overflow-x-auto">
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
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classesList.map((cls) => (
              <TableRow key={cls.id}>
                <TableCell className="font-medium">{cls.code}</TableCell>
                <TableCell className="max-w-[180px] truncate">{cls.name}</TableCell>
                <TableCell className="max-w-[160px] truncate">{cls.lecturerName || "Chưa phân công"}</TableCell>
                <TableCell>{cls.room || "Chưa xếp"}</TableCell>
                <TableCell className="tabular-nums">{cls.currentStudents}/{cls.maxStudents}</TableCell>
                <TableCell className="tabular-nums">
                  {formatDate(cls.startDate)} - {formatDate(cls.endDate)}
                </TableCell>
                <TableCell>{getClassStatusBadge(cls.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Chi tiết</Button>
                </TableCell>
              </TableRow>
            ))}
            {classesList.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <EmptyState
                    icon={School}
                    title="Chưa có lớp học"
                    description="Tạo lớp học mới để phân bổ giảng viên và sinh viên."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </TabsContent>
  );
}

export default async function CoursesPage() {
  await requireRole(["admin", "staff", "lecturer"]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Quản lý Môn học & Lớp học" description="Quản lý danh sách môn học và các lớp học phần" />

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">Môn học</TabsTrigger>
          <TabsTrigger value="classes">Lớp học</TabsTrigger>
        </TabsList>
        
        <Suspense fallback={<LoadingSkeleton />}>
          <CoursesTable />
        </Suspense>
        
        <Suspense fallback={<LoadingSkeleton />}>
          <ClassesTable />
        </Suspense>
      </Tabs>
    </div>
  );
}

import { Suspense } from "react";
import { requireAuth } from "@/lib/session";
import { getStudentCourses } from "@/lib/cache";
import { formatSchedule } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  GraduationCap,
  Clock,
  MapPin,
  Calendar,
  User,
  Library,
} from "lucide-react";

const statusMap: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: "Chờ duyệt", color: "bg-amber-500 hover:bg-amber-600" },
  approved: { label: "Đã duyệt", color: "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" },
  waitlisted: { label: "Chờ slot", color: "bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600" },
  enrolled: { label: "Đang học", color: "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600" },
  completed: { label: "Hoàn thành", color: "bg-indigo-500 hover:bg-indigo-600" },
  dropped: { label: "Đã hủy", color: "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600" },
  rejected: { label: "Bị từ chối", color: "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600" },
};

async function CoursesContent({ userId }: { userId: string }) {
  const myCourses = await getStudentCourses(userId);

  const enrolledCount = myCourses.filter(
    (c) => c.enrollment.status === "enrolled"
  ).length;
  const completedCount = myCourses.filter(
    (c) => c.enrollment.status === "completed"
  ).length;
  const totalCount = myCourses.length;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang học</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{enrolledCount}</div>
            <p className="text-xs text-muted-foreground">
              Môn học đang diễn ra
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoàn thành</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Môn học đã tích lũy
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đăng ký</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{totalCount}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả các môn đã đăng ký
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {myCourses.map((item) => {
          const statusInfo = statusMap[item.enrollment.status || ""] || {
            label: item.enrollment.status,
            color: "bg-muted-foreground",
          };

          return (
            <Card key={item.enrollment.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="line-clamp-2 text-lg">
                      {item.course.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {item.class.code} - {item.class.name}
                    </CardDescription>
                  </div>
                  <Badge className={`${statusInfo.color} text-white border-none whitespace-nowrap`}>
                    {statusInfo.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" aria-hidden="true" />
                  <span>Giảng viên: {item.lecturer?.name || "Chưa phân công"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {item.course.credits} tín chỉ ({item.course.hours} giờ)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  <span>Phòng: {item.class.room || "Chưa xếp phòng"}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span className="line-clamp-1">
                    Lịch: {formatSchedule(item.class.schedule)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {item.class.startDate
                      ? format(new Date(item.class.startDate), "dd/MM/yyyy", {
                          locale: vi,
                        })
                      : "…"}{" "}
                    -{" "}
                    {item.class.endDate
                      ? format(new Date(item.class.endDate), "dd/MM/yyyy", {
                          locale: vi,
                        })
                      : "…"}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {myCourses.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            <Library className="mx-auto h-12 w-12 mb-4 opacity-20" aria-hidden="true" />
            <p>Bạn chưa đăng ký môn học nào.</p>
          </div>
        )}
      </div>
    </>
  );
}

export default async function MyCoursesPage() {
  const session = await requireAuth();

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Môn học của tôi</h1>
        <p className="text-muted-foreground mt-2">
          Quản lý danh sách các môn học bạn đã đăng ký và theo dõi tiến độ.
        </p>
      </div>

      <Suspense fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      }>
        <CoursesContent userId={session.user.id} />
      </Suspense>
    </div>
  );
}

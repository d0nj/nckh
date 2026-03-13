import { Suspense } from "react";
import { requireAuth } from "@/lib/session";
import { getOpenClasses, getStudentEnrollments } from "@/lib/cache";
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
  Users,
  MapPin,
  Clock,
  Calendar,
  GraduationCap,
  Search,
} from "lucide-react";
import { EnrollButton } from "./enroll-button";

const programTypeLabels: Record<string, string> = {
  short_term: "Ngắn hạn",
  certificate: "Chứng chỉ",
  diploma: "Bằng cấp",
};

async function RegisterContent({ userId }: { userId: string }) {
  const [openClasses, myEnrollments] = await Promise.all([
    getOpenClasses(),
    getStudentEnrollments(userId),
  ]);

  const enrolledClassIds = new Set(myEnrollments.map((e) => e.classId));

  const activeEnrollmentCount = myEnrollments.filter(
    (e) => e.status !== "dropped" && e.status !== "rejected"
  ).length;

  // Group classes by program
  const groupedByProgram = new Map<
    string,
    {
      program: typeof openClasses[number]["program"];
      classes: typeof openClasses;
    }
  >();

  for (const cls of openClasses) {
    const programId = cls.program.id;
    if (!groupedByProgram.has(programId)) {
      groupedByProgram.set(programId, {
        program: cls.program,
        classes: [],
      });
    }
    groupedByProgram.get(programId)!.classes.push(cls);
  }

  const distinctProgramCount = groupedByProgram.size;

  return (
    <>
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lớp đang mở</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{openClasses.length}</div>
            <p className="text-xs text-muted-foreground">
              Lớp học phần có thể đăng ký
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã đăng ký</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{activeEnrollmentCount}</div>
            <p className="text-xs text-muted-foreground">
              Môn học đang tham gia
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chương trình</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{distinctProgramCount}</div>
            <p className="text-xs text-muted-foreground">
              Chương trình đào tạo đang mở
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Class listings grouped by program */}
      {openClasses.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-20" aria-hidden="true" />
          <p>Hiện tại không có lớp học phần nào đang mở đăng ký.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(groupedByProgram.values()).map((group) => (
            <section key={group.program.id} className="space-y-4">
              {/* Program heading */}
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold tracking-tight">
                  {group.program.name}
                </h2>
                <Badge variant="secondary">
                  {programTypeLabels[group.program.type ?? ""] ??
                    group.program.type}
                </Badge>
              </div>

              {/* Class cards grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {group.classes.map((cls) => {
                  const isFull =
                    cls.class.currentStudents >= cls.class.maxStudents;
                  const alreadyEnrolled = enrolledClassIds.has(cls.class.id);
                  const fillRatio =
                    cls.class.maxStudents > 0
                      ? cls.class.currentStudents / cls.class.maxStudents
                      : 0;

                  let slotColor = "text-emerald-600 dark:text-emerald-400";
                  if (fillRatio >= 1) {
                    slotColor = "text-red-600 dark:text-red-400";
                  } else if (fillRatio > 0.8) {
                    slotColor = "text-amber-600 dark:text-amber-400";
                  }

                  return (
                    <Card key={cls.class.id} className="flex flex-col">
                      <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <CardTitle className="line-clamp-2 text-lg">
                              {cls.course.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {cls.class.code}
                              {cls.class.name ? ` - ${cls.class.name}` : ""}
                            </CardDescription>
                          </div>
                          <span
                            className={`text-sm font-semibold whitespace-nowrap tabular-nums ${slotColor}`}
                          >
                            {cls.class.currentStudents}/{cls.class.maxStudents}{" "}
                            slot
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>
                            Giảng viên:{" "}
                            {cls.lecturer?.name || "Chưa phân công"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>
                            {cls.course.credits} tín chỉ ({cls.course.hours}{" "}
                            giờ)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>
                            Phòng học: {cls.class.room || "Chưa xếp phòng"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="line-clamp-1">
                            Lịch học: {formatSchedule(cls.class.schedule)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>
                            Thời gian:{" "}
                            {cls.class.startDate
                              ? format(
                                  new Date(cls.class.startDate),
                                  "dd/MM/yyyy",
                                  { locale: vi }
                                )
                              : "…"}{" "}
                            -{" "}
                            {cls.class.endDate
                              ? format(
                                  new Date(cls.class.endDate),
                                  "dd/MM/yyyy",
                                  { locale: vi }
                                )
                              : "…"}
                          </span>
                        </div>

                        {/* Slots progress bar */}
                        <div className="mt-1">
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full motion-safe:transition-all ${
                                fillRatio >= 1
                                  ? "bg-destructive"
                                  : fillRatio > 0.8
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                              }`}
                              style={{
                                width: `${Math.min(fillRatio * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>

                        {/* Enroll button */}
                        <div className="mt-auto pt-2">
                          <EnrollButton
                            classId={cls.class.id}
                            studentId={userId}
                            isFull={isFull}
                            alreadyEnrolled={alreadyEnrolled}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

export default async function RegisterPage() {
  const session = await requireAuth();

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Đăng ký môn học</h1>
        <p className="text-muted-foreground mt-2">
          Chọn lớp học phần bạn muốn đăng ký. Các lớp đã đầy sẽ được thêm vào
          danh sách chờ.
        </p>
      </div>

      <Suspense fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      }>
        <RegisterContent userId={session.user.id} />
      </Suspense>
    </div>
  );
}

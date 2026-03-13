import { Suspense } from "react";
import { requireAuth } from "@/lib/session";
import { getStudentSchedule } from "@/lib/cache";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  BookOpen,
  Calendar,
} from "lucide-react";
import {
  WeeklyCalendar,
  type CalendarClassData,
  type ScheduleSlot,
} from "@/components/weekly-calendar";

const DAY_LABELS: Record<number, string> = {
  2: "Thứ Hai",
  3: "Thứ Ba",
  4: "Thứ Tư",
  5: "Thứ Năm",
  6: "Thứ Sáu",
  7: "Thứ Bảy",
  8: "Chủ Nhật",
};

async function ScheduleContent({ userId }: { userId: string }) {
  const mySchedule = await getStudentSchedule(userId);

  // Transform data for the calendar component
  const calendarData: CalendarClassData[] = mySchedule.map((item) => ({
    enrollmentId: item.enrollment.id,
    courseName: item.course.name,
    classCode: item.class.code,
    room: item.class.room,
    schedule: item.class.schedule,
    classStatus: item.class.status,
    lecturerName: item.lecturer?.name || null,
  }));

  return (
    <>
      {/* Weekly Calendar View */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-semibold">Chế độ xem tuần</h2>
        </div>
        <WeeklyCalendar classes={calendarData} />
      </section>

      {/* Detailed Card List */}
      {mySchedule.length > 0 && (
        <section className="space-y-6 pt-6 border-t border-border/50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Danh sách lớp học</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {mySchedule.map((item) => {
              let scheduleSlots: ScheduleSlot[] = [];
              try {
                scheduleSlots = JSON.parse(item.class.schedule || "[]");
              } catch {
                // ignore
              }

              return (
                <div
                  key={item.enrollment.id}
                  className="group bg-card hover:bg-accent/10 border border-border rounded-2xl p-6 shadow-sm hover:shadow-md motion-safe:transition-all motion-safe:duration-300 flex flex-col gap-4"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {item.class.code}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-foreground leading-tight group-hover:text-primary motion-safe:transition-colors">
                      {item.course.name}
                    </h3>
                  </div>

                  <div className="space-y-2.5 mt-auto pt-2">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <User className="w-4 h-4 text-foreground/70" aria-hidden="true" />
                      <span>
                        {item.lecturer?.name || "Chưa phân công"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-foreground/70" aria-hidden="true" />
                      <span>
                        Phòng: {item.class.room || "Chưa xếp phòng"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <CalendarDays className="w-4 h-4 text-foreground/70" aria-hidden="true" />
                      <span>
                        {item.class.startDate
                          ? format(
                              new Date(item.class.startDate),
                              "dd/MM/yyyy",
                              { locale: vi }
                            )
                          : "…"}{" "}
                        –{" "}
                        {item.class.endDate
                          ? format(
                              new Date(item.class.endDate),
                              "dd/MM/yyyy",
                              { locale: vi }
                            )
                          : "…"}
                      </span>
                    </div>

                    {/* Schedule slots */}
                    {scheduleSlots.length > 0 && (
                      <div className="bg-muted/40 rounded-xl p-3 space-y-2 mt-1">
                        {scheduleSlots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2 font-medium text-foreground">
                              <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
                              {DAY_LABELS[slot.day] || `Ngày ${slot.day}`},{" "}
                              {slot.startTime} – {slot.endTime}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

export default async function SchedulePage() {
  const session = await requireAuth();

  return (
    <div className="space-y-10 p-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Thời khóa biểu</h1>
        <p className="text-muted-foreground mt-2">
          Lịch học chi tiết các môn học bạn đã đăng ký trong học kỳ này.
        </p>
      </div>

      <Suspense fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      }>
        <ScheduleContent userId={session.user.id} />
      </Suspense>
    </div>
  );
}

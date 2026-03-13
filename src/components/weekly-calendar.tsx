"use client";

import React, { useState, useMemo } from "react";
import { MapPin, Hash, Clock } from "lucide-react";

// --- Types ---
export type ScheduleSlot = {
  day: number;
  startTime: string;
  endTime: string;
};

export type CalendarClassData = {
  enrollmentId: string;
  courseName: string;
  classCode: string;
  room: string | null;
  schedule: string | null;
  classStatus: string | null;
  lecturerName: string | null;
};

type CalendarEvent = {
  id: string;
  courseName: string;
  classCode: string;
  room: string;
  lecturerName: string;
  day: number;
  startTime: string;
  endTime: string;
  startMins: number;
  durationMins: number;
  colorIndex: number;
};

// --- Constants ---
const DAYS = [
  { value: 2, label: "Thứ Hai", short: "T2" },
  { value: 3, label: "Thứ Ba", short: "T3" },
  { value: 4, label: "Thứ Tư", short: "T4" },
  { value: 5, label: "Thứ Năm", short: "T5" },
  { value: 6, label: "Thứ Sáu", short: "T6" },
  { value: 7, label: "Thứ Bảy", short: "T7" },
  { value: 8, label: "Chủ Nhật", short: "CN" },
];

const START_HOUR = 7;
const END_HOUR = 21;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => START_HOUR + i
);
const REM_PER_HOUR = 5;
const REM_PER_MIN = REM_PER_HOUR / 60;

const EVENT_COLORS = [
  {
    bg: "bg-blue-500/15",
    text: "text-blue-900 dark:text-blue-200",
    border: "border-blue-500/20",
    borderLeft: "border-l-blue-500",
  },
  {
    bg: "bg-emerald-500/15",
    text: "text-emerald-900 dark:text-emerald-200",
    border: "border-emerald-500/20",
    borderLeft: "border-l-emerald-500",
  },
  {
    bg: "bg-violet-500/15",
    text: "text-violet-900 dark:text-violet-200",
    border: "border-violet-500/20",
    borderLeft: "border-l-violet-500",
  },
  {
    bg: "bg-amber-500/15",
    text: "text-amber-900 dark:text-amber-200",
    border: "border-amber-500/20",
    borderLeft: "border-l-amber-500",
  },
  {
    bg: "bg-pink-500/15",
    text: "text-pink-900 dark:text-pink-200",
    border: "border-pink-500/20",
    borderLeft: "border-l-pink-500",
  },
  {
    bg: "bg-cyan-500/15",
    text: "text-cyan-900 dark:text-cyan-200",
    border: "border-cyan-500/20",
    borderLeft: "border-l-cyan-500",
  },
  {
    bg: "bg-rose-500/15",
    text: "text-rose-900 dark:text-rose-200",
    border: "border-rose-500/20",
    borderLeft: "border-l-rose-500",
  },
  {
    bg: "bg-indigo-500/15",
    text: "text-indigo-900 dark:text-indigo-200",
    border: "border-indigo-500/20",
    borderLeft: "border-l-indigo-500",
  },
];

// --- Helpers ---
const parseTime = (timeStr: string) => {
  const [h, m] = timeStr.split(":").map(Number);
  return (h - START_HOUR) * 60 + m;
};

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash);
};

function getTodayDay(): number {
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon, ...
  if (jsDay === 0) return 8; // CN
  return jsDay + 1; // Mon=2, Tue=3, ...
}

export function WeeklyCalendar({
  classes,
}: {
  classes: CalendarClassData[];
}) {
  const [selectedDay, setSelectedDay] = useState<number>(getTodayDay);

  const events = useMemo(() => {
    const parsed: CalendarEvent[] = [];
    classes.forEach((cls, clsIndex) => {
      if (cls.classStatus === "cancelled") return;
      if (!cls.schedule) return;

      try {
        const schedule: ScheduleSlot[] = JSON.parse(cls.schedule);
        const colorIndex = hashString(cls.classCode) % EVENT_COLORS.length;

        schedule.forEach((slot, idx) => {
          const startMins = parseTime(slot.startTime);
          const endMins = parseTime(slot.endTime);

          parsed.push({
            id: `${cls.enrollmentId}-${idx}`,
            courseName: cls.courseName,
            classCode: cls.classCode,
            room: cls.room || "TBA",
            lecturerName: cls.lecturerName || "Chưa phân công",
            day: slot.day,
            startTime: slot.startTime,
            endTime: slot.endTime,
            startMins,
            durationMins: endMins - startMins,
            colorIndex,
          });
        });
      } catch {
        // skip unparseable schedule
      }
    });
    return parsed;
  }, [classes]);

  const totalEvents = events.length;

  if (totalEvents === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border rounded-2xl bg-muted/20">
        <Clock className="h-16 w-16 text-muted-foreground/50 mb-4" aria-hidden="true" />
        <h3 className="text-lg font-medium">Chưa có lịch học</h3>
        <p className="text-muted-foreground mt-1">
          Hiện tại bạn không có lớp học nào đang diễn ra.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Mobile Day Picker */}
      <div className="md:hidden flex overflow-x-auto gap-2 pb-4 snap-x scrollbar-none">
        {DAYS.map((day) => {
          const count = events.filter((e) => e.day === day.value).length;
          return (
            <button
              key={day.value}
              onClick={() => setSelectedDay(day.value)}
              aria-label={`${day.label}${count > 0 ? `, ${count} lớp` : ""}`}
              className={`snap-start whitespace-nowrap px-4 py-2.5 rounded-full text-sm font-medium motion-safe:transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                selectedDay === day.value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {day.label}
              {count > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-background/30 text-xs" aria-hidden="true">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Calendar Container */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Header Row */}
        <div className="flex border-b border-border bg-muted/30">
          {/* Corner */}
          <div className="w-16 shrink-0 border-r border-border" />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-7">
            {DAYS.map((day) => {
              const isSelected = selectedDay === day.value;
              const isToday = getTodayDay() === day.value;
              return (
                <button
                  type="button"
                  key={`header-${day.value}`}
                  className={`py-3 text-center text-sm font-semibold border-r border-border last:border-r-0 md:cursor-default transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                    isToday
                      ? "text-primary"
                      : "text-foreground"
                  } ${isSelected ? "block" : "hidden md:block"}`}
                  onClick={() => setSelectedDay(day.value)}
                >
                  <span className="hidden md:inline">{day.label}</span>
                  <span className="md:hidden">{day.label}</span>
                  {isToday && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex overflow-y-auto max-h-[65vh] min-h-[500px] relative scrollbar-thin overscroll-y-contain" tabIndex={0} role="region" aria-label="Lịch học theo tuần">
          {/* Time Y-Axis */}
          <div className="w-16 shrink-0 border-r border-border bg-muted/10 sticky left-0 z-20">
            {HOURS.map((h) => (
              <div
                key={h}
                className="relative"
                style={{ height: `${REM_PER_HOUR}rem` }}
              >
                <span className="absolute -top-2.5 right-3 text-xs font-medium text-muted-foreground">
                  {h.toString().padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-7 relative">
            {/* Horizontal Grid Lines */}
            <div className="absolute inset-0 pointer-events-none z-0">
              {HOURS.map((h) => (
                <div
                  key={`line-${h}`}
                  className="border-b border-border/40"
                  style={{ height: `${REM_PER_HOUR}rem` }}
                />
              ))}
            </div>

            {/* Day Columns */}
            {DAYS.map((day) => (
              <div
                key={`col-${day.value}`}
                className={`relative border-r border-border/40 last:border-r-0 ${
                  selectedDay !== day.value
                    ? "hidden md:block"
                    : "block"
                }`}
                style={{
                  height: `${HOURS.length * REM_PER_HOUR}rem`,
                }}
              >
                {events
                  .filter((e) => e.day === day.value)
                  .map((event, index) => {
                    const color = EVENT_COLORS[event.colorIndex];
                    return (
                      <div
                        key={event.id}
                        className={`absolute left-1 right-1 rounded-lg border-l-4 p-2.5 overflow-hidden motion-safe:transition-all hover:z-50 hover:shadow-lg cursor-default group ${color.bg} ${color.text} ${color.border} ${color.borderLeft}`}
                        style={{
                          top: `${event.startMins * REM_PER_MIN}rem`,
                          height: `${Math.max(event.durationMins * REM_PER_MIN, 2.5)}rem`,
                        }}
                      >
                        <div className="font-semibold text-sm leading-tight mb-1 line-clamp-2 group-hover:line-clamp-none group-focus-within:line-clamp-none">
                          {event.courseName}
                        </div>
                        <div className="flex flex-col gap-0.5 opacity-90 text-xs font-medium">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" aria-hidden="true" />
                            {event.startTime} – {event.endTime}
                          </span>
                          <div className="flex items-center justify-between mt-0.5">
                            <span className="flex items-center gap-1.5">
                              <Hash className="w-3.5 h-3.5 opacity-70 shrink-0" aria-hidden="true" />
                              {event.classCode}
                            </span>
                            <span className="flex items-center gap-1 bg-background/40 px-1.5 py-0.5 rounded-md text-[11px]">
                              <MapPin className="w-3 h-3 opacity-70" aria-hidden="true" />
                              {event.room}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

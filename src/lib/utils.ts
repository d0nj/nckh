import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DAY_NAMES: Record<number, string> = {
  1: "Chủ Nhật",
  2: "Thứ Hai",
  3: "Thứ Ba",
  4: "Thứ Tư",
  5: "Thứ Năm",
  6: "Thứ Sáu",
  7: "Thứ Bảy",
  8: "Chủ Nhật",
}

export function formatSchedule(schedule: string | null | undefined): string {
  if (!schedule) return "Chưa có lịch"
  try {
    const items = JSON.parse(schedule) as Array<{
      day: number
      startTime: string
      endTime: string
    }>
    if (!Array.isArray(items) || items.length === 0) return "Chưa có lịch"
    return items
      .map((s) => `${DAY_NAMES[s.day] || `Ngày ${s.day}`}: ${s.startTime}–${s.endTime}`)
      .join(", ")
  } catch {
    return String(schedule)
  }
}

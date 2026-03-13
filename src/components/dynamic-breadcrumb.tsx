"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const segmentLabels: Record<string, string> = {
  dashboard: "Tổng quan",
  programs: "Chương trình",
  courses: "Môn học & Lớp",
  students: "Sinh viên",
  exams: "Thi & Điểm",
  certificates: "Văn bằng",
  finance: "Tài chính",
  reports: "Báo cáo",
  settings: "Cài đặt",
  new: "Tạo mới",
};

function isUuidLike(segment: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
}

function getLabel(segment: string): string {
  if (segmentLabels[segment]) return segmentLabels[segment];
  if (isUuidLike(segment)) return "Chi tiết";
  return segment;
}

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Build breadcrumb items from path segments
  // e.g. /dashboard/programs/123 → ["dashboard", "programs", "123"]
  const items = segments.map((segment, index) => ({
    label: getLabel(segment),
    href: "/" + segments.slice(0, index + 1).join("/"),
  }));

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* "Hệ thống" root item - always first, hidden on mobile */}
        <BreadcrumbItem className="hidden md:block">
          {items.length <= 1 ? (
            <BreadcrumbPage>Hệ thống</BreadcrumbPage>
          ) : (
            <BreadcrumbLink href="/dashboard">Hệ thống</BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <span key={item.href} className="contents">
              <BreadcrumbSeparator
                className={index === 0 ? "hidden md:block" : ""}
              />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href}>
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

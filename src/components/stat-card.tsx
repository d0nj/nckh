import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: "primary" | "emerald" | "amber" | "red" | "blue" | "purple";
  className?: string;
}

const colorMap = {
  primary: {
    border: "border-l-primary",
    iconBg: "bg-primary/10",
    iconText: "text-primary",
    valueText: "text-primary",
  },
  emerald: {
    border: "border-l-emerald-500",
    iconBg: "bg-emerald-500/10",
    iconText: "text-emerald-600 dark:text-emerald-400",
    valueText: "text-emerald-600 dark:text-emerald-400",
  },
  amber: {
    border: "border-l-amber-500",
    iconBg: "bg-amber-500/10",
    iconText: "text-amber-600 dark:text-amber-400",
    valueText: "text-amber-600 dark:text-amber-400",
  },
  red: {
    border: "border-l-red-500",
    iconBg: "bg-red-500/10",
    iconText: "text-red-600 dark:text-red-400",
    valueText: "text-red-600 dark:text-red-400",
  },
  blue: {
    border: "border-l-blue-500",
    iconBg: "bg-blue-500/10",
    iconText: "text-blue-600 dark:text-blue-400",
    valueText: "text-blue-600 dark:text-blue-400",
  },
  purple: {
    border: "border-l-purple-500",
    iconBg: "bg-purple-500/10",
    iconText: "text-purple-600 dark:text-purple-400",
    valueText: "text-purple-600 dark:text-purple-400",
  },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  color = "primary",
  className,
}: StatCardProps) {
  const colors = colorMap[color];

  return (
    <Card
      className={cn(
        "border-l-4 shadow-sm hover:shadow-md motion-safe:transition-shadow",
        colors.border,
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground truncate">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-full", colors.iconBg)}>
          <Icon className={cn("h-4 w-4", colors.iconText)} aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold tabular-nums", colors.valueText)}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

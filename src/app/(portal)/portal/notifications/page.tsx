import { Suspense } from "react";
import { requireAuth } from "@/lib/session";
import { getStudentNotifications } from "@/lib/cache";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BookOpen,
  ClipboardList,
  Wallet,
  Award,
  Bell,
} from "lucide-react";

const getRelativeTime = (dateString: string | null) => {
  if (!dateString) return "";
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

const getIconForType = (type: string | null) => {
  switch (type) {
    case "info":
      return <Info className="h-5 w-5 text-blue-500" aria-hidden="true" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-500" aria-hidden="true" />;
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />;
    case "error":
      return <XCircle className="h-5 w-5 text-red-500" aria-hidden="true" />;
    case "enrollment":
      return <BookOpen className="h-5 w-5 text-indigo-500" aria-hidden="true" />;
    case "grade":
      return <ClipboardList className="h-5 w-5 text-purple-500" aria-hidden="true" />;
    case "payment":
      return <Wallet className="h-5 w-5 text-emerald-500" aria-hidden="true" />;
    case "certificate":
      return <Award className="h-5 w-5 text-amber-500" aria-hidden="true" />;
    default:
      return <Bell className="h-5 w-5 text-gray-500" aria-hidden="true" />;
  }
};

async function NotificationsContent({ userId }: { userId: string }) {
  const userNotifications = await getStudentNotifications(userId);

  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            Thông báo
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full px-2.5">
                {unreadCount} chưa đọc
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            Cập nhật các thông tin mới nhất từ nhà trường.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {userNotifications.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-medium">Bạn chưa có thông báo nào</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Khi có thông báo mới, chúng sẽ xuất hiện ở đây.
              </p>
            </CardContent>
          </Card>
        ) : (
          userNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`motion-safe:transition-colors ${
                !notification.isRead ? "bg-muted/30 border-primary/20" : ""
              }`}
            >
              <CardContent className="p-4 sm:p-6 flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getIconForType(notification.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4
                      className={`text-base ${
                        !notification.isRead ? "font-bold" : "font-medium"
                      }`}
                    >
                      {notification.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {getRelativeTime(notification.createdAt)}
                      </span>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.content}
                  </p>
                  {notification.link && (
                    <a
                      href={notification.link}
                      className="text-sm text-primary hover:underline inline-block mt-2 font-medium"
                    >
                      Xem chi tiết &rarr;
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}

export default async function NotificationsPage() {
  const session = await requireAuth();

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto animate-fade-in">
      <Suspense fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      }>
        <NotificationsContent userId={session.user.id} />
      </Suspense>
    </div>
  );
}

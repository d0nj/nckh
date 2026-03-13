import { Suspense } from "react";
import { requireRole } from "@/lib/session";
import { getCertificatesList } from "@/lib/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CreateCertificateDialog, CertWorkflowActions } from "./cert-actions";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { Award, Clock, Printer, Send, FileText } from "lucide-react";

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3" />
      <div className="h-64 bg-muted rounded" />
    </div>
  );
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15",
  approved: "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15",
  printed: "bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/15",
  issued: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15",
  revoked: "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/15",
};

const statusLabels: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  printed: "Đã in",
  issued: "Đã phát",
  revoked: "Đã thu hồi",
};

const classificationLabels: Record<string, string> = {
  excellent: "Xuất sắc",
  good: "Giỏi",
  fair: "Khá",
  average: "Trung bình",
};

async function CertificatesStatsAndTable() {
  const certsList = await getCertificatesList();

  // Calculate stats
  const total = certsList.length;
  const pending = certsList.filter((c) => c.status === "pending").length;
  const printed = certsList.filter((c) => c.status === "printed").length;
  const issued = certsList.filter((c) => c.status === "issued").length;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tổng cấp" value={total} icon={Award} color="primary" className="animate-fade-in-up stagger-1" />
        <StatCard title="Chờ duyệt" value={pending} icon={Clock} color="amber" className="animate-fade-in-up stagger-2" />
        <StatCard title="Đã in" value={printed} icon={Printer} color="purple" className="animate-fade-in-up stagger-3" />
        <StatCard title="Đã phát" value={issued} icon={Send} color="emerald" className="animate-fade-in-up stagger-4" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách văn bằng</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Số hiệu</TableHead>
                <TableHead>Số vào sổ</TableHead>
                <TableHead>Sinh viên</TableHead>
                <TableHead>Chương trình</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Ngày cấp</TableHead>
                <TableHead>Xếp loại</TableHead>
                <TableHead>GPA</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {certsList.map((cert) => (
                <TableRow key={cert.id}>
                  <TableCell className="font-medium">{cert.certificateNumber}</TableCell>
                  <TableCell>{cert.registryNumber}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{cert.studentName}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{cert.programName}</TableCell>
                  <TableCell>{cert.type === "certificate" ? "Chứng chỉ" : "Bằng cấp"}</TableCell>
                  <TableCell className="tabular-nums">
                    {cert.issueDate ? format(new Date(cert.issueDate), "dd/MM/yyyy", { locale: vi }) : "-"}
                  </TableCell>
                  <TableCell>{classificationLabels[cert.classification || ""] || cert.classification}</TableCell>
                  <TableCell className="tabular-nums">{cert.gpa}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[cert.status || ""]} variant="outline">
                      {statusLabels[cert.status || ""] || cert.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <CertWorkflowActions certId={cert.id} currentStatus={cert.status || ""} />
                  </TableCell>
                </TableRow>
              ))}
              {certsList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="p-0">
                    <EmptyState
                      icon={FileText}
                      title="Chưa có văn bằng"
                      description="Tạo văn bằng mới cho sinh viên đã hoàn thành chương trình."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

export default async function CertificatesPage() {
  await requireRole(["admin", "staff"]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Quản lý Văn bằng & Chứng chỉ" description="Theo dõi và cấp phát văn bằng cho sinh viên">
        <CreateCertificateDialog />
      </PageHeader>

      <Suspense fallback={<LoadingSkeleton />}>
        <CertificatesStatsAndTable />
      </Suspense>
    </div>
  );
}

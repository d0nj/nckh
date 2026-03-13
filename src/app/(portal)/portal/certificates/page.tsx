import { Suspense } from "react";
import { requireAuth } from "@/lib/session";
import { getStudentCertificates } from "@/lib/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Award, FileCheck } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  certificate: "Chứng chỉ",
  diploma: "Văn bằng",
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  excellent: "Xuất sắc",
  good: "Giỏi",
  fair: "Khá",
  average: "Trung bình",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  printed: "Đã in",
  issued: "Đã cấp",
  revoked: "Đã thu hồi",
};

async function CertificatesContent({ userId }: { userId: string }) {
  const studentCertificates = await getStudentCertificates(userId);

  return (
    <>
      {studentCertificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
          <Award className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium">Bạn chưa có văn bằng hoặc chứng chỉ nào</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Các văn bằng và chứng chỉ sẽ hiển thị tại đây sau khi được cấp.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {studentCertificates.map(({ certificate, program }) => {
            const Icon = certificate.type === "diploma" ? Award : FileCheck;

            return (
              <Card key={certificate.id} className="overflow-hidden flex flex-col">
                <CardHeader className="bg-muted/50 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-background rounded-lg shadow-sm">
                      <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        certificate.status === "pending"
                          ? "border-yellow-500 text-yellow-600"
                          : certificate.status === "approved"
                          ? "border-blue-500 text-blue-600"
                          : certificate.status === "printed"
                          ? "border-purple-500 text-purple-600"
                          : certificate.status === "issued"
                          ? "border-green-500 text-green-600"
                          : certificate.status === "revoked"
                          ? "border-red-500 text-red-600"
                          : ""
                      }
                    >
                      {STATUS_LABELS[certificate.status] || certificate.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4 text-xl">
                    {TYPE_LABELS[certificate.type] || certificate.type}
                  </CardTitle>
                  <p className="text-sm font-medium text-muted-foreground line-clamp-2">
                    {program.name}
                  </p>
                </CardHeader>
                <CardContent className="pt-4 flex-1 flex flex-col gap-2 text-sm">
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-muted-foreground">Số hiệu:</span>
                    <span className="font-medium text-right">{certificate.certificateNumber || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-muted-foreground">Số vào sổ:</span>
                    <span className="font-medium text-right">{certificate.registryNumber || "-"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <span className="text-muted-foreground">Xếp loại:</span>
                    <span className="font-medium text-right">
                      {certificate.classification
                        ? CLASSIFICATION_LABELS[certificate.classification] || certificate.classification
                        : "-"}
                    </span>
                  </div>
                  {certificate.gpa && (
                    <div className="grid grid-cols-2 gap-1">
                      <span className="text-muted-foreground">Điểm trung bình:</span>
                      <span className="font-medium text-right tabular-nums">{certificate.gpa}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-1 mt-auto pt-2">
                    <span className="text-muted-foreground">Ngày cấp:</span>
                    <span className="font-medium text-right tabular-nums">
                      {certificate.issueDate
                        ? format(new Date(certificate.issueDate), "dd/MM/yyyy", { locale: vi })
                        : "-"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

export default async function CertificatesPage() {
  const session = await requireAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Văn bằng & Chứng chỉ</h1>
        <p className="text-muted-foreground">Danh sách văn bằng và chứng chỉ của bạn</p>
      </div>

      <Suspense fallback={
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      }>
        <CertificatesContent userId={session.user.id} />
      </Suspense>
    </div>
  );
}

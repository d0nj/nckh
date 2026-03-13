"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { revalidateCertificates } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CreateCertificateDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    programId: "",
    certificateNumber: "",
    registryNumber: "",
    type: "certificate",
    classification: "good",
    gpa: "",
    issueDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          gpa: form.gpa ? parseFloat(form.gpa) : null,
          status: "pending",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create certificate");
      }

      toast.success("Tạo văn bằng thành công");
      setOpen(false);
      await revalidateCertificates();
      router.refresh();
      setForm({
        studentId: "",
        programId: "",
        certificateNumber: "",
        registryNumber: "",
        type: "certificate",
        classification: "good",
        gpa: "",
        issueDate: "",
      });
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tạo văn bằng");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Tạo văn bằng</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo văn bằng mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin để tạo văn bằng hoặc chứng chỉ mới.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Mã sinh viên</Label>
              <Input
                id="studentId"
                required
                autoComplete="off"
                spellCheck={false}
                placeholder="Nhập mã sinh viên…"
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="programId">Mã chương trình</Label>
              <Input
                id="programId"
                required
                autoComplete="off"
                spellCheck={false}
                placeholder="Nhập mã chương trình…"
                value={form.programId}
                onChange={(e) => setForm({ ...form, programId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="certificateNumber">Số hiệu</Label>
              <Input
                id="certificateNumber"
                required
                autoComplete="off"
                spellCheck={false}
                placeholder="Nhập số hiệu…"
                value={form.certificateNumber}
                onChange={(e) =>
                  setForm({ ...form, certificateNumber: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registryNumber">Số vào sổ</Label>
              <Input
                id="registryNumber"
                required
                autoComplete="off"
                spellCheck={false}
                placeholder="Nhập số vào sổ…"
                value={form.registryNumber}
                onChange={(e) =>
                  setForm({ ...form, registryNumber: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Loại</Label>
              <Select
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v ?? form.type })}
                items={[{ value: "certificate", label: "Chứng chỉ" }, { value: "diploma", label: "Bằng cấp" }]}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="certificate">Chứng chỉ</SelectItem>
                  <SelectItem value="diploma">Bằng cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="classification">Xếp loại</Label>
              <Select
                value={form.classification}
                onValueChange={(v) =>
                  setForm({ ...form, classification: v ?? form.classification })
                }
                items={[{ value: "excellent", label: "Xuất sắc" }, { value: "good", label: "Giỏi" }, { value: "fair", label: "Khá" }, { value: "average", label: "Trung bình" }]}
              >
                <SelectTrigger id="classification">
                  <SelectValue placeholder="Chọn xếp loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Xuất sắc</SelectItem>
                  <SelectItem value="good">Giỏi</SelectItem>
                  <SelectItem value="fair">Khá</SelectItem>
                  <SelectItem value="average">Trung bình</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gpa">GPA</Label>
              <Input
                id="gpa"
                type="number"
                step="0.01"
                inputMode="decimal"
                autoComplete="off"
                placeholder="VD: 3.5"
                value={form.gpa}
                onChange={(e) => setForm({ ...form, gpa: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issueDate">Ngày cấp</Label>
              <Input
                id="issueDate"
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang tạo…" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CertWorkflowActions({
  certId,
  currentStatus,
}: {
  certId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokedReason, setRevokedReason] = useState("");

  const updateStatus = async (status: string, reason?: string) => {
    setLoading(true);
    try {
      const body: any = { status };
      if (reason) body.revokedReason = reason;

      const res = await fetch(`/api/certificates/${certId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("Cập nhật trạng thái thành công");
      await revalidateCertificates();
      router.refresh();
      if (status === "revoked") {
        setRevokeOpen(false);
        setRevokedReason("");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = () => {
    if (!revokedReason.trim()) {
      toast.error("Vui lòng nhập lý do thu hồi");
      return;
    }
    updateStatus("revoked", revokedReason);
  };

  return (
    <div className="flex items-center gap-2">
      {currentStatus === "pending" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatus("approved")}
          disabled={loading}
        >
          Duyệt
        </Button>
      )}
      {currentStatus === "approved" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatus("printed")}
          disabled={loading}
        >
          In
        </Button>
      )}
      {currentStatus === "printed" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateStatus("issued")}
          disabled={loading}
        >
          Cấp phát
        </Button>
      )}

      {["pending", "approved", "printed", "issued"].includes(currentStatus) && (
        <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
          <DialogTrigger render={<Button size="sm" variant="destructive" disabled={loading} />}>Thu hồi</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thu hồi văn bằng</DialogTitle>
              <DialogDescription>
                Vui lòng nhập lý do thu hồi văn bằng này. Hành động này không thể
                hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reason">Lý do thu hồi</Label>
                <Textarea
                  id="reason"
                  value={revokedReason}
                  onChange={(e) => setRevokedReason(e.target.value)}
                  placeholder="Nhập lý do…"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRevokeOpen(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleRevoke}
                disabled={loading}
              >
                {loading ? "Đang xử lý…" : "Xác nhận thu hồi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

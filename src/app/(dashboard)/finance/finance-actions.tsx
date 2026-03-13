"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { revalidateFinance, revalidateDebts } from "@/lib/actions";

export function CreatePaymentDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    amount: 0,
    type: "tuition",
    method: "cash",
    status: "pending",
    description: "",
    enrollmentId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Ghi nhận thanh toán thành công");
      setOpen(false);
      await revalidateFinance();
      router.refresh();
      setForm({ studentId: "", amount: 0, type: "tuition", method: "cash", status: "pending", description: "", enrollmentId: "" });
    } catch {
      toast.error("Lỗi ghi nhận thanh toán");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        Thêm thanh toán
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ghi nhận thanh toán</DialogTitle>
          <DialogDescription>
            Nhập thông tin thanh toán mới cho sinh viên.
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
              <Label htmlFor="amount">Số tiền</Label>
              <Input
                id="amount"
                type="number"
                required
                min="0"
                inputMode="numeric"
                autoComplete="off"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Loại thanh toán</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v ?? form.type })} items={[{ value: "tuition", label: "Học phí" }, { value: "fee", label: "Lệ phí" }, { value: "other", label: "Khác" }]}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tuition">Học phí</SelectItem>
                  <SelectItem value="fee">Lệ phí</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Phương thức</Label>
              <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v ?? form.method })} items={[{ value: "cash", label: "Tiền mặt" }, { value: "bank_transfer", label: "Chuyển khoản" }, { value: "credit_card", label: "Thẻ tín dụng" }, { value: "e_wallet", label: "Ví điện tử" }, { value: "online", label: "Online" }]}>
                <SelectTrigger id="method">
                  <SelectValue placeholder="Chọn phương thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="bank_transfer">Chuyển khoản</SelectItem>
                  <SelectItem value="credit_card">Thẻ tín dụng</SelectItem>
                  <SelectItem value="e_wallet">Ví điện tử</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v ?? form.status })} items={[{ value: "pending", label: "Chờ xử lý" }, { value: "completed", label: "Hoàn thành" }]}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="enrollmentId">Mã đăng ký (Tùy chọn)</Label>
              <Input
                id="enrollmentId"
                autoComplete="off"
                spellCheck={false}
                placeholder="Nhập mã đăng ký…"
                value={form.enrollmentId}
                onChange={(e) => setForm({ ...form, enrollmentId: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu…" : "Lưu thanh toán"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CreateDebtDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    amount: 0,
    reason: "",
    dueDate: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Tạo công nợ thành công");
      setOpen(false);
      await revalidateDebts();
      router.refresh();
      setForm({ studentId: "", amount: 0, reason: "", dueDate: "" });
    } catch {
      toast.error("Lỗi tạo công nợ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        Thêm công nợ
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo công nợ mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin công nợ cho sinh viên.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="debt-studentId">Mã sinh viên</Label>
            <Input
              id="debt-studentId"
              required
              autoComplete="off"
              spellCheck={false}
              placeholder="Nhập mã sinh viên…"
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="debt-amount">Số tiền</Label>
            <Input
              id="debt-amount"
              type="number"
              required
              min="0"
              inputMode="numeric"
              autoComplete="off"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="debt-reason">Lý do</Label>
            <Input
              id="debt-reason"
              required
              placeholder="Nhập lý do…"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="debt-dueDate">Hạn thanh toán</Label>
            <Input
              id="debt-dueDate"
              type="date"
              required
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu…" : "Tạo công nợ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DebtStatusAction({ debtId }: { debtId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const updateStatus = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/debts/${debtId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Cập nhật trạng thái thành công");
      await revalidateDebts();
      router.refresh();
    } catch {
      toast.error("Lỗi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" disabled={loading} />}>
        <span className="sr-only">Mở menu</span>
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => updateStatus("paid")}>
          Đã thanh toán
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateStatus("waived")}>
          Miễn giảm
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewProgramPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    type: "short_term",
    durationHours: 0,
    totalCredits: 0,
    tuitionFee: 0,
    status: "draft",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Tạo chương trình thành công");
      router.push("/programs");
    } catch {
      toast.error("Lỗi tạo chương trình");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Link href="/programs">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Thêm chương trình đào tạo</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin chương trình</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="code">Mã chương trình *</Label>
                <Input id="code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="VD: CNTT-01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Tên chương trình *</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="VD: Công nghệ thông tin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Loại hình</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v ?? form.type })} items={[{ value: "short_term", label: "Ngắn hạn" }, { value: "certificate", label: "Chứng chỉ" }, { value: "diploma", label: "Chính quy" }]}>
                   <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short_term">Ngắn hạn</SelectItem>
                    <SelectItem value="certificate">Chứng chỉ</SelectItem>
                    <SelectItem value="diploma">Chính quy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v ?? form.status })} items={[{ value: "draft", label: "Bản nháp" }, { value: "active", label: "Hoạt động" }, { value: "inactive", label: "Ngừng hoạt động" }]}>
                   <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Bản nháp</SelectItem>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationHours">Thời lượng (giờ) *</Label>
                <Input id="durationHours" type="number" required min={0} value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalCredits">Số tín chỉ</Label>
                <Input id="totalCredits" type="number" min={0} value={form.totalCredits} onChange={(e) => setForm({ ...form, totalCredits: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tuitionFee">Học phí (VNĐ)</Label>
                <Input id="tuitionFee" type="number" min={0} value={form.tuitionFee} onChange={(e) => setForm({ ...form, tuitionFee: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả chương trình đào tạo..." rows={4} />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Link href="/programs"><Button variant="outline">Hủy</Button></Link>
              <Button type="submit" disabled={loading}>{loading ? "Đang tạo..." : "Tạo chương trình"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

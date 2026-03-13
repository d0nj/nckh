"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";

const roleLabels: Record<string, string> = {
  admin: "Quản trị viên",
  staff: "Nhân viên",
  lecturer: "Giảng viên",
  student: "Sinh viên",
};

export default function SettingsPage() {
  const { data: session, isPending } = authClient.useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    idNumber: "",
  });

  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || "",
        phone: (session.user as any).phone || "",
        gender: (session.user as any).gender || "",
        dateOfBirth: (session.user as any).dateOfBirth ? new Date((session.user as any).dateOfBirth).toISOString().split('T')[0] : "",
        address: (session.user as any).address || "",
        idNumber: (session.user as any).idNumber || "",
      });
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: session.user.id,
          ...form,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      toast.error("Lỗi cập nhật thông tin");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="space-y-6 max-w-4xl">
        <PageHeader title="Cài đặt tài khoản" description="Quản lý thông tin cá nhân và tùy chọn hệ thống" />
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center">Đang tải…</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Cài đặt tài khoản" description="Quản lý thông tin cá nhân và tùy chọn hệ thống" />

      <Card>
        <CardHeader>
          <CardTitle>Thông tin cá nhân</CardTitle>
          <CardDescription>Cập nhật thông tin hồ sơ của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Họ tên</Label>
                <Input 
                  id="name" 
                  value={form.name} 
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nhập họ tên…" 
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={session?.user?.email || ""} 
                  readOnly 
                  className="bg-muted"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Điện thoại</Label>
                <Input 
                  id="phone" 
                  value={form.phone} 
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Nhập số điện thoại…" 
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Vai trò</Label>
                <Input 
                  id="role" 
                  value={roleLabels[(session?.user as any)?.role || ""] || (session?.user as any)?.role || ""} 
                  readOnly 
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Giới tính</Label>
                <Select 
                  value={form.gender} 
                  onValueChange={(v) => setForm((prev) => ({ ...prev, gender: v ?? prev.gender }))}
                  items={[{ value: "Nam", label: "Nam" }, { value: "Nữ", label: "Nữ" }, { value: "Khác", label: "Khác" }]}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nam">Nam</SelectItem>
                    <SelectItem value="Nữ">Nữ</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Ngày sinh</Label>
                <Input 
                  id="dateOfBirth" 
                  type="date" 
                  value={form.dateOfBirth} 
                  onChange={(e) => setForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                  autoComplete="bday"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Input 
                  id="address" 
                  value={form.address} 
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Nhập địa chỉ đầy đủ…" 
                  autoComplete="street-address"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="idNumber">CCCD / CMND</Label>
                <Input 
                  id="idNumber" 
                  value={form.idNumber} 
                  onChange={(e) => setForm((prev) => ({ ...prev, idNumber: e.target.value }))}
                  placeholder="Nhập số CCCD…" 
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Đang cập nhật…" : "Cập nhật thông tin"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

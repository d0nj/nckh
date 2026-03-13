"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Program {
  id: string;
  code: string;
  name: string;
}

function NewCourseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState(() => ({
    programId: searchParams.get("programId") ?? "",
    code: "",
    name: "",
    description: "",
    credits: 0,
    hours: 0,
    order: 0,
    status: "active",
  }));

  useEffect(() => {
    async function fetchPrograms() {
      try {
        const res = await fetch("/api/programs");
        if (!res.ok) throw new Error("Failed to fetch programs");
        const data = await res.json();
        setPrograms(data);
      } catch (error) {
        toast.error("Lỗi tải danh sách chương trình đào tạo");
      } finally {
        setIsLoadingPrograms(false);
      }
    }
    fetchPrograms();
  }, []);

  const programItems = useMemo(() => programs.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` })), [programs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string | null) => {
    if (value === null) return;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.programId || !formData.code || !formData.name) {
      toast.error("Vui lòng điền đầy đủ các trường bắt buộc");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to create course");
      }

      toast.success("Tạo môn học thành công");
      router.push("/courses");
      router.refresh();
    } catch (error) {
      toast.error("Lỗi tạo môn học");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" render={<Link href="/courses" />} aria-label="Quay lại">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Thêm môn học</h1>
      </div>

      <Card className="bg-card text-card-foreground">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Thông tin môn học</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="programId">Chương trình đào tạo <span className="text-destructive">*</span></Label>
                <Select 
                  value={formData.programId} 
                  onValueChange={(value) => handleSelectChange("programId", value)}
                  disabled={isLoadingPrograms}
                  items={programItems}
                >
                  <SelectTrigger id="programId">
                    <SelectValue placeholder={isLoadingPrograms ? "Đang tải…" : "Chọn chương trình đào tạo"} />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.code} - {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Mã môn học <span className="text-destructive">*</span></Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="VD: CNTT-101"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Tên môn học <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="VD: Lập trình cơ bản"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Mô tả chi tiết về môn học…"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credits">Số tín chỉ</Label>
                <Input
                  id="credits"
                  name="credits"
                  type="number"
                  min="0"
                  value={formData.credits}
                  onChange={handleChange}
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hours">Số giờ</Label>
                <Input
                  id="hours"
                  name="hours"
                  type="number"
                  min="0"
                  value={formData.hours}
                  onChange={handleChange}
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Thứ tự</Label>
                <Input
                  id="order"
                  name="order"
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={handleChange}
                  inputMode="numeric"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => handleSelectChange("status", value)}
                  items={[{ value: "active", label: "Hoạt động" }, { value: "inactive", label: "Ngừng" }]}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Ngừng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <Button type="button" variant="outline" render={<Link href="/courses" />}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang tạo…" : "Tạo môn học"}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}

export default function NewCoursePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Đang tải…</div>}>
      <NewCourseForm />
    </Suspense>
  );
}

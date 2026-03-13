"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface ClassItem {
  id: string;
  code: string;
  name: string;
  courseName: string;
}

export default function NewExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultClassId = searchParams.get("classId") || "";

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    classId: defaultClassId,
    name: "",
    type: "",
    examDate: "",
    startTime: "",
    endTime: "",
    room: "",
    duration: "",
    maxScore: "10",
    weight: "1",
    status: "scheduled",
  });

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/classes");
        if (!res.ok) throw new Error("Failed to fetch classes");
        const data = await res.json();
        setClasses(data);
      } catch (error) {
        toast.error("Không thể tải danh sách lớp học");
      } finally {
        setIsLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  const classItems = useMemo(() => classes.map((c) => ({ value: c.id, label: `${c.code} - ${c.name} (${c.courseName})` })), [classes]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string | null) => {
    if (value !== null) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          duration: formData.duration ? parseInt(formData.duration) : null,
          maxScore: parseFloat(formData.maxScore),
          weight: parseFloat(formData.weight),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create exam");
      }

      toast.success("Tạo bài thi thành công");
      router.push("/exams");
    } catch (error) {
      toast.error("Lỗi tạo bài thi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            aria-label="Quay lại"
            onClick={() => router.push("/exams")}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Thêm bài thi</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin bài thi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lớp học */}
              <div className="space-y-2">
                <Label htmlFor="classId">Lớp học *</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(val) => handleSelectChange("classId", val)}
                  disabled={isLoadingClasses}
                  required
                  items={classItems}
                >
                  <SelectTrigger id="classId">
                    <SelectValue placeholder="Chọn lớp học" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} - {c.name} ({c.courseName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tên bài thi */}
              <div className="space-y-2">
                <Label htmlFor="name">Tên bài thi *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="VD: Kiểm tra giữa kỳ"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="off"
                />
              </div>

              {/* Loại hình */}
              <div className="space-y-2">
                <Label htmlFor="type">Loại hình *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => handleSelectChange("type", val)}
                  required
                  items={[{ value: "midterm", label: "Giữa kỳ" }, { value: "final", label: "Cuối kỳ" }, { value: "quiz", label: "Kiểm tra" }, { value: "assignment", label: "Bài tập" }, { value: "practical", label: "Thực hành" }]}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Chọn loại hình" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="midterm">Giữa kỳ</SelectItem>
                    <SelectItem value="final">Cuối kỳ</SelectItem>
                    <SelectItem value="quiz">Kiểm tra</SelectItem>
                    <SelectItem value="assignment">Bài tập</SelectItem>
                    <SelectItem value="practical">Thực hành</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Ngày thi */}
              <div className="space-y-2">
                <Label htmlFor="examDate">Ngày thi *</Label>
                <Input
                  id="examDate"
                  name="examDate"
                  type="date"
                  value={formData.examDate}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Giờ bắt đầu */}
              <div className="space-y-2">
                <Label htmlFor="startTime">Giờ bắt đầu</Label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange}
                />
              </div>

              {/* Giờ kết thúc */}
              <div className="space-y-2">
                <Label htmlFor="endTime">Giờ kết thúc</Label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange}
                />
              </div>

              {/* Phòng thi */}
              <div className="space-y-2">
                <Label htmlFor="room">Phòng thi</Label>
                <Input
                  id="room"
                  name="room"
                  placeholder="VD: P.301"
                  value={formData.room}
                  onChange={handleChange}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {/* Thời gian (phút) */}
              <div className="space-y-2">
                <Label htmlFor="duration">Thời gian (phút)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  placeholder="90"
                  min="1"
                  value={formData.duration}
                  onChange={handleChange}
                  inputMode="numeric"
                />
              </div>

              {/* Điểm tối đa */}
              <div className="space-y-2">
                <Label htmlFor="maxScore">Điểm tối đa</Label>
                <Input
                  id="maxScore"
                  name="maxScore"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.maxScore}
                  onChange={handleChange}
                  inputMode="decimal"
                />
              </div>

              {/* Trọng số */}
              <div className="space-y-2">
                <Label htmlFor="weight">Trọng số</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.weight}
                  onChange={handleChange}
                  inputMode="decimal"
                />
              </div>

              {/* Trạng thái */}
              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => handleSelectChange("status", val)}
                  items={[{ value: "scheduled", label: "Sắp diễn ra" }, { value: "in_progress", label: "Đang thi" }, { value: "completed", label: "Đã kết thúc" }, { value: "cancelled", label: "Đã hủy" }]}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Sắp diễn ra</SelectItem>
                    <SelectItem value="in_progress">Đang thi</SelectItem>
                    <SelectItem value="completed">Đã kết thúc</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/exams")}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang tạo…" : "Tạo bài thi"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

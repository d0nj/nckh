"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { revalidatePrograms } from "@/lib/actions";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import { Trash2, Pencil } from "lucide-react";
import Link from "next/link";

export function ProgramActions({ programId }: { programId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/programs/${programId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Đã xóa chương trình");
      await revalidatePrograms();
      router.push("/programs");
    } catch {
      toast.error("Lỗi khi xóa chương trình");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="destructive" size="sm" disabled={deleting} />}>
          <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Xóa
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Tất cả môn học và lớp học liên quan cũng sẽ bị xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

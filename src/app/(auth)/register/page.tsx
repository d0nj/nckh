"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, GraduationCap } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await signUp.email({ email, password, name });
      if (error) {
        toast.error(error.message || "Đăng ký thất bại. Vui lòng thử lại.");
      } else {
        toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
        router.push("/login");
      }
    } catch (err) {
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border-0 shadow-2xl bg-card/80 backdrop-blur-xl">
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="flex justify-center mb-2">
          <div className="p-3 bg-primary/10 rounded-full">
            <GraduationCap className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Đăng ký tài khoản</CardTitle>
        <CardDescription>Nhập thông tin của bạn để tạo tài khoản mới</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Họ và tên</Label>
            <Input 
              id="name" 
              placeholder="Nguyễn Văn A" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              disabled={isLoading}
              autoComplete="name"
              spellCheck={false}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              disabled={isLoading}
              autoComplete="email"
              inputMode="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              placeholder="••••••••"
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-4">
          <Button 
            type="submit" 
            className="w-full motion-safe:transition-all motion-safe:duration-200 shadow-md hover:shadow-lg" 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
            Đăng ký
          </Button>
          <div className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline motion-safe:transition-colors">
              Đăng nhập
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

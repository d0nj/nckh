"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Award,
  Wallet,
  Bell,
  Menu,
  Settings,
  LogOut,
  User,
  PlusCircle,
} from "lucide-react";

import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { href: "/portal", label: "Trang chủ", icon: LayoutDashboard },
  { href: "/portal/register", label: "Đăng ký", icon: PlusCircle },
  { href: "/portal/courses", label: "Môn học", icon: BookOpen },
  { href: "/portal/schedule", label: "Lịch học", icon: CalendarDays },
  { href: "/portal/grades", label: "Điểm", icon: ClipboardList },
  { href: "/portal/certificates", label: "Văn bằng", icon: Award },
  { href: "/portal/payments", label: "Học phí", icon: Wallet },
  { href: "/portal/notifications", label: "Thông báo", icon: Bell, badge: 2 },
];

export function PortalNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4 max-w-7xl">
        <div className="lg:hidden mr-2">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger className="inline-flex items-center justify-center rounded-lg h-8 w-8 hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Menu className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Mở menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-[320px]">
              <div className="flex items-center gap-2 font-bold text-lg mb-6 mt-4">
                <GraduationCap
                  className="h-6 w-6 text-primary"
                  aria-hidden="true"
                />
                <span>NCKH - Cổng Sinh viên</span>
              </div>
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Button
                      key={item.href}
                      render={
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                        />
                      }
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start"
                    >
                      <item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                      {item.label}
                      {item.badge && (
                        <Badge
                          variant="destructive"
                          className="ml-auto flex h-5 w-5 items-center justify-center rounded-full p-0"
                          aria-label={`${item.badge} thông báo mới`}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Logo */}
        <Link
          href="/portal"
          className="flex items-center gap-2 font-bold text-lg mr-6 group"
        >
          <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
            <GraduationCap
              className="h-5 w-5 text-primary"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-background"
              aria-hidden="true"
            />
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 h-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Button
                key={item.href}
                render={<Link href={item.href} />}
                variant="ghost"
                size="sm"
                className={`relative h-10 rounded-none hover:text-primary transition-colors ${
                  isActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                {item.label}
                {item.badge && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[10px]"
                    aria-label={`${item.badge} thông báo mới`}
                  >
                    {item.badge}
                  </Badge>
                )}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full"
                    aria-hidden="true"
                  />
                )}
              </Button>
            );
          })}
        </nav>

        {/* User Dropdown */}
        <div className="flex items-center gap-4 ml-auto">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger className="relative flex items-center justify-center h-8 w-8 rounded-full hover:bg-muted transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={session?.user?.image || ""}
                  alt={session?.user?.name || "User"}
                />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">
                      {session?.user?.name || "Sinh viên"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {session?.user?.email || "student@nckh.edu.vn"}
                    </p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => router.push("/portal/settings")}
              >
                <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Cài đặt</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

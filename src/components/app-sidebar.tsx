"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  School,
  Users,
  ClipboardList,
  Award,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
  User
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSession, signOut } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";

const navGroups = [
  {
    label: "Tổng quan",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Đào tạo",
    items: [
      { title: "Chương trình", url: "/programs", icon: BookOpen },
      { title: "Môn học & Lớp", url: "/courses", icon: School },
      { title: "Sinh viên", url: "/students", icon: Users },
    ],
  },
  {
    label: "Học vụ",
    items: [
      { title: "Thi & Điểm", url: "/exams", icon: ClipboardList },
      { title: "Văn bằng", url: "/certificates", icon: Award },
    ],
  },
  {
    label: "Tài chính",
    items: [
      { title: "Thu chi", url: "/finance", icon: Wallet },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      { title: "Báo cáo", url: "/reports", icon: BarChart3 },
      { title: "Cài đặt", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
                  <SidebarMenuItem>
                      <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
                        <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground ring-2 ring-amber-500 ring-offset-2 ring-offset-background">
                          <GraduationCap className="size-4" aria-hidden="true" />
                        </div>
                        <div className="flex flex-col gap-0.5 leading-none">
                          <span className="font-semibold">NCKH</span>
                          <span className="text-xs text-muted-foreground">Quản lý Đào tạo</span>
                        </div>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton render={<Link href={item.url} />} isActive={pathname === item.url || pathname.startsWith(item.url + "/")}>
                                <item.icon aria-hidden="true" />
                                <span>{item.title}</span>
                              </SidebarMenuButton>
                          </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <DropdownMenu>
                      <DropdownMenuTrigger>
                        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                    <AvatarFallback className="rounded-lg">{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 min-w-0 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{session?.user?.name || "Người dùng"}</span>
                    <span className="truncate text-xs">{session?.user?.email || ""}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side="bottom" align="end" sideOffset={4}>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                        <AvatarFallback className="rounded-lg">{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 min-w-0 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{session?.user?.name || "Người dùng"}</span>
                        <span className="truncate text-xs">{session?.user?.email || ""}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                        <DropdownMenuItem render={<Link href="/settings" />}>
                          <User className="mr-2 h-4 w-4" aria-hidden="true" />
                          Hồ sơ cá nhân
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href="/settings" />}>
                          <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                          Cài đặt
                        </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

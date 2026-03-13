import { Suspense } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

// Auth is handled at the page level (requireAuth/requireRole) inside each page component.
// Keeping the layout free of dynamic APIs (headers()) allows the static shell to be prerendered with PPR.
// Client components using usePathname() must be wrapped in <Suspense> for PPR compatibility.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Suspense>
        <AppSidebar />
      </Suspense>
      <SidebarInset>
        <div className="h-[3px] w-full bg-gradient-to-r from-primary via-primary/80 to-amber-500" />
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Suspense>
              <DynamicBreadcrumb />
            </Suspense>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 pt-0 md:p-8 md:pt-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

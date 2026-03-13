import * as React from "react";
import { Suspense } from "react";
import { PortalNavbar } from "@/components/portal-navbar";
import { CurrentYear } from "@/components/current-year";

// Auth is handled at the page level (requireAuth/requireRole) inside each page component.
// Keeping the layout free of dynamic APIs (headers()) allows the static shell to be prerendered with PPR.

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/10 font-sans">
      <div className="h-1 w-full bg-gradient-to-r from-primary via-amber-500 to-primary" />
      <PortalNavbar />
      <main className="container mx-auto px-4 py-6 max-w-7xl flex-1">
        {children}
      </main>
      <footer className="border-t py-8 mt-auto bg-background">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>&copy; <Suspense fallback="2026"><CurrentYear /></Suspense> NCKH.</p>
          <p className="mt-2 md:mt-0 font-medium text-primary">
            Cổng thông tin sinh viên
          </p>
        </div>
      </footer>
    </div>
  );
}

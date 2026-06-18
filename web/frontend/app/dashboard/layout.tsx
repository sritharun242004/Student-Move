"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
// import "./dashboard-fix.css";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  return (
    // <SessionProvider>
    <NotificationProvider>
      <div className="flex min-h-screen overflow-hidden bg-background">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <div className="flex flex-1 flex-col overflow-hidden relative">
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6 mt-16 relative z-0">
            {children}
          </main>
        </div>
        <Toaster position="top-center" richColors />
      </div>
    </NotificationProvider>
    // </SessionProvider>
  );
}

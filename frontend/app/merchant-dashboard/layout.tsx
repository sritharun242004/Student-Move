"use client";

import type React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect } from "react";
import {
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanLine,
  Store,
  Ticket,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Toaster } from "sonner";

interface MerchantDashboardLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: "Overview",
    href: "/merchant-dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Offers",
    href: "/merchant-dashboard/offers",
    icon: Ticket,
  },
  {
    name: "Redeems",
    href: "/merchant-dashboard/redeems",
    icon: ScanLine,
  },
  {
    name: "Redeem History",
    href: "/merchant-dashboard/redeem-history",
    icon: History,
  },
  {
    name: "Profile",
    href: "/merchant-dashboard/profile",
    icon: UserRound,
  },
];

export default function MerchantDashboardLayout({
  children,
}: MerchantDashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (session?.role !== "merchant") {
      router.push("/dashboard");
    }
  }, [status, session?.role, router]);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/auth/signin" });
  };

  const isNavigationItemActive = (href: string) =>
    href === "/merchant-dashboard"
      ? pathname === href
      : pathname.startsWith(href);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading merchant dashboard...</p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.role !== "merchant") {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="flex min-h-screen">
        <aside className="hidden md:flex w-64 border-r bg-card p-4 flex-col">
          <div className="flex items-center gap-2 py-2">
            <Store className="h-5 w-5 text-primary" />
            <div>
            <p className="text-lg font-semibold">StudentMoves</p>
            <p className="text-xs text-muted-foreground">Merchants</p>
            </div>
          </div>

          <nav className="mt-4 space-y-1">
            {navigationItems.map((item) => {
              const isActive = isNavigationItemActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <Button variant="ghost" className="mt-auto justify-start" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Log out
          </Button>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden" aria-label="Open navigation menu">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 flex flex-col">
                  <SheetHeader className="border-b">
                    <div className="flex items-center gap-2 py-2">
                      <Store className="h-5 w-5 text-primary" />
                      <div>
                        <SheetTitle>StudentMoves</SheetTitle>
                        <SheetDescription>Merchants</SheetDescription>
                      </div>
                    </div>
                  </SheetHeader>

                  <nav className="space-y-1 p-4">
                    {navigationItems.map((item) => {
                      const isActive = isNavigationItemActive(item.href);

                      return (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </nav>

                  <div className="mt-auto border-t p-4">
                    <SheetClose asChild>
                      <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Log out
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>

              <div>
                <h1 className="text-lg font-semibold">Merchant Dashboard</h1>
                <p className="text-xs text-muted-foreground">{session.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="md:hidden">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </Button>
          </header>

          <main className="flex-1 p-4 sm:p-6">{children}</main>
        </div>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  );
}

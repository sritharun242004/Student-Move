"use client";

import { Bell, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "next-auth/react";
import { useIdStore } from "@/app/store/useLeaseId";
import { useEffect } from "react";
import Link from "next/link";
// import { toast } from "sonner";
import { LandlordSelector } from "./landlord-selector";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { useRoleColor } from "@/hooks/useRoleColor";
import { useTitleText } from "@/hooks/useTitleText";
import { useLandlordContext } from "@/app/store/useLandlordContext";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  const { data: session } = useSession();
  const roleColor = useRoleColor(session?.role);
  const titleText = useTitleText(session?.role);

  const setId = useIdStore((state) => state.setId);
  const { clearSelectedLandlord } = useLandlordContext();

  // Clear landlord context when session changes (user logs in/out)
  useEffect(() => {
    if (!session) {
      clearSelectedLandlord();
      setId("");
    }
  }, [session, clearSelectedLandlord, setId]);

  useEffect(() => {
    if (!session || session.role !== "tenant") return;
    const fetchId = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/tenants/requests/active/`,
          {
            headers: {
              Authorization: `Bearer ${session?.access}`,
            },
          }
        );
        if (!res.ok) {
          setId("0");
          return;
        }

        const data = await res.json();

        if (data?.data?.id) setId(data.data.id);
      } catch (err) {
        console.error("Something went wrong!", err);
      }
    };

    fetchId();
  }, [setId, session?.access]);

  const handleSignOut = () => {
    // Clear landlord context and lease ID before signing out
    clearSelectedLandlord();
    setId("");
    signOut({ callbackUrl: "/auth/signin" });
  };

  return (
    <header
      className={`${roleColor} border-b fixed z-30  ${
        sidebarOpen
          ? "md:w-[calc(100%-16rem)] w-full"
          : "md:w-[calc(100%-5rem)] w-full"
      } ml-auto`}
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden z-40 relative"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <h1 className="text-2xl font-semibold">{titleText}</h1>
        <div className="flex items-center gap-4">
          {/* Landlord Selector for Agents */}
          <LandlordSelector />

          {/* Notification Dropdown */}
          <NotificationDropdown />

          <div className="hidden md:flex flex-col items-end text-xs text-right">
            <div className="font-medium">
              {session?.firstName} {session?.lastName}
            </div>
            <div className=" text-muted-foreground">{session?.email}</div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full z-40"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage alt="User" />
                  <AvatarFallback className="bg-primary/20">
                    {session?.firstName?.[0]}
                    {session?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-50">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/properties">Properties</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Home,
  HousePlus,
  Layers,
  LayoutDashboard,
  Menu,
  PieChart,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Unplug,
  Users,
  Wrench,
  Bell,
  Store,
  Ticket,
  Video,
  Upload,
  UserCircle,
  Shield,
  UploadCloud,
  UploadIcon,
  LucideUpload,
  BatteryPlus,
  Users2,
  UserX,
  UserPen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.role || "tenant";

  // Define navigation items with role access permissions
  const allNavigationItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      roles: ["admin"],
    },
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard/landlord-lease-management",
      roles: ["landlord", "agent"],
    },
    {
      name: "All Properties",
      icon: Home,
      href: "/dashboard/properties",
      roles: ["landlord", "tenant", "admin"],
    },
    {
      name: "My Properties",
      icon: Home,
      href: "/dashboard/my-properties",
      roles: ["landlord", "agent"],
    },
    {
      name: "Add Property",
      icon: HousePlus,
      href: "/dashboard/property-add",
      roles: ["landlord", "agent"],
    },
    {
      name: "My Inquiries",
      icon: Unplug,
      href: "/dashboard/inquiries",
      roles: ["tenant", "landlord", "agent"],
    },
    {
      name: "Landlord Management",
      icon: Users,
      href: "/dashboard/agent-landlord-management",
      roles: ["agent"],
    },
    {
      name: "Tenant Management", 
      icon: Users,
      href: "/dashboard/tenant-management",
      roles: ["landlord", "agent"],
    },
    {
      name: "Lease Management",
      icon: PieChart,
      href: "/dashboard/tenant-lease-management", 
      roles: ["tenant"],
    },
    {
      name: "Maintenance",
      icon: Wrench,
      href: "/dashboard/tenant-maintenance",
      roles: ["tenant"],
    },
    {
      name: "Inspections",
      icon: Layers,
      href: "/dashboard/tenant-inspections",
      roles: ["tenant"],
    },
    {
      name: "Merchant Offers",
      icon: Ticket,
      href: "/dashboard/student-merchant",
      roles: ["tenant"],
    },
     {
      name: "Marketplace",
      icon: ShoppingBag,
      href: "/dashboard/marketplace",
      roles: ["tenant", "landlord", "agent", "admin"],
    },
     {
      name: "Merchant Management",
      icon: Store,
      href: "/dashboard/merchant-management",
      roles: ["admin"],
    },
    {
      name: "Student Reels",
      icon: Video,
      href: "/dashboard/reels",
      roles: ["tenant", "landlord", "agent"],
    },
    {
      name: "Create Reel",
      icon: BatteryPlus,
      href: "/dashboard/reels/upload",
      roles: ["tenant", "landlord", "agent", "admin"],
    },
    {
      name: "My Profile",
      icon: UserCircle,
      href: "/dashboard/reels/profile",
      roles: ["tenant", "landlord", "agent", "admin"],
    },
    {
      name: "Search Profiles",
      icon: Search,
      href: "/dashboard/reels/search-profiles",
      roles: ["tenant", "landlord", "agent"],
    },
    {
      name: "Reels Moderation",
      icon: Shield,
      href: "/dashboard/reels/admin",
      roles: ["admin"],
    },
   
    {
      name: "Marketplace Admin",
      icon: Shield,
      href: "/dashboard/marketplace/admin",
      roles: ["admin"],
    },
    {
      name: "Student Profiles",
      icon: UserPen,
      href: "/dashboard/reels/student-profiles",
      roles: ["admin"],
    },
    {
      name: "Maintenance Management",
      icon: ShoppingCart,
      href: "/dashboard/maintenance-view",
      roles: ["landlord", "agent"],
    },
    {
      name: "Property Approval",
      icon: HousePlus,
      href: "/dashboard/property-approval",
      roles: ["admin"],
    },
    {
      name: "Landlord Management",
      icon: Users2,
      href: "/dashboard/landlord-management",
      roles: ["admin"],
    },
    {
      name: "Agent Management",
      icon: Users,
      href: "/dashboard/agent-management",
      roles: ["admin"],
    },
    
    {
      name: "Tenant Management",
      icon: UserPen, 
      href: "/dashboard/admin-tenant-list",
      roles: ["admin"],
    },
    {
      name: "Lease View",
      icon: PieChart,
      href: "/dashboard/admin-lease-management",
      roles: ["admin"],
    },
    {
      name: "Agreement Signing",
      icon: Layers,
      href: "/dashboard/admin-agreement-signing",
      roles: ["admin"],
    },
   

    // {
    //   name: "Tenant Payment System",
    //   icon: BarChart3,
    //   href: "/dashboard/tenant-payment-system",
    //   roles: ["tenant"],
    // },

    // {
    //   name: "Customers",
    //   icon: Users,
    //   href: "/dashboard/customers",
    //   roles: ["admin"],
    // },
    // {
    //   name: "Reports",
    //   icon: PieChart,
    //   href: "/dashboard/reports",
    //   roles: ["admin"],
    // },
    // {
    //   name: "Inventory",
    //   icon: Layers,
    //   href: "/dashboard/inventory",
    //   roles: ["admin"],
    // },
      {
      name: "Notifications",
      icon: Bell,
      href: "/dashboard/notifications",
      roles: ["tenant", "landlord", "agent", "admin"],
    },
    {
      name: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      roles: ["admin", "tenant", "landlord", "agent"],
    },
  ];

  // Filter navigation items based on user role and separate into four sections
  const allFilteredItems = allNavigationItems.filter((item) =>
    item.roles.includes(userRole)
  );

  // Section 1: All Properties
  const firstSectionItems = allFilteredItems.filter((item) => {
    return item.name === "All Properties";
  });

  // Section 2: My Property (property-related items)
  const myPropertyItems = allFilteredItems.filter((item) => {
    const includeInMyProperty = [
      "My Properties",
      "Add Property",
    ];
    return includeInMyProperty.includes(item.name);
  });

  // Section 3: Reels and Merchant
  const reelsAndMerchantItems = allFilteredItems.filter((item) => {
    const includeInReelsAndMerchant = [
      "Student Reels",
      "Create Reel",
      "My Profile",
      "Reels Moderation",
      "Student Profiles",
      "Search Profiles",
      "Merchant Offers",
      "Merchant Management",
      "Marketplace",
      "Marketplace Admin",
    ];
    return includeInReelsAndMerchant.includes(item.name);
  });

  // Section 4: Settings and Notifications
  const settingsNotificationItems = allFilteredItems.filter((item) => {
    const includeInSettingsNotification = [
      "Settings",
      "Notifications",
    ];
    return includeInSettingsNotification.includes(item.name);
  });

  // Main navigation: All other items
  const mainNavigationItems = allFilteredItems.filter((item) => {
    const excludeFromMain = [
      "All Properties",
      "My Properties",
      "Add Property",
      "Student Reels",
      "Create Reel",
      "My Profile",
      "Reels Moderation",
      "Student Profiles",
      "Merchant Offers",
      "Search Profiles",
      "Merchant Management",
      "Marketplace",
      "Marketplace Admin",
      "Settings",
      "Notifications",
    ];
    return !excludeFromMain.includes(item.name);
  });

  const isCurrentPath = (href: string) => {
    return pathname === href;
  };

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-card border-r transition-all duration-500 ease-in-out hidden md:block fixed h-screen z-20 overflow-hidden`}
      >
        <div className="flex h-16 items-center border-b px-4">
          <div
            className={`flex items-center ${
              !sidebarOpen && "justify-center w-full"
            }`}
          >
            <LayoutDashboard className="h-6 w-6 text-primary" />
            {sidebarOpen && (
              <span className="ml-2 text-lg font-semibold">Dashboard</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        <div className="py-4 h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="space-y-1 px-2">
            {/* Section 1: All Properties */}
            {firstSectionItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isCurrentPath(item.href)
                    ? "bg-primary/10 text-amber-600"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } group flex items-center rounded-md px-2 py-2 text-sm font-medium`}
              >
                <item.icon
                  className={`${
                    isCurrentPath(item.href)
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  } mr-3 h-5 w-5 flex-shrink-0`}
                  aria-hidden="true"
                />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}

            {/* Divider after Section 1 */}
            {firstSectionItems.length > 0 && mainNavigationItems.length > 0 && (
              <div className="border-t border-border my-4"></div>
            )}

            {/* Section 2: My Property */}
            {myPropertyItems.length > 0 && (
              <>
                {sidebarOpen && (
                  <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    My Property
                  </div>
                )}
                {myPropertyItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isCurrentPath(item.href)
                        ? "bg-primary/10 text-amber-600"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    } group flex items-center rounded-md px-2 py-2 text-sm font-medium`}
                  >
                    <item.icon
                      className={`${
                        isCurrentPath(item.href)
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      } mr-3 h-5 w-5 flex-shrink-0`}
                      aria-hidden="true"
                    />
                    {sidebarOpen && <span>{item.name}</span>}
                  </Link>
                ))}
              </>
            )}

            {/* Divider after Section 2 */}
            {myPropertyItems.length > 0 && mainNavigationItems.length > 0 && (
              <div className="border-t border-border my-4"></div>
            )}

             {sidebarOpen && (
                  <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Property & Lease
                  </div>
                )}

            {/* Main Navigation Items */}
            {mainNavigationItems.map((item) => (
              
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  isCurrentPath(item.href)
                    ? "bg-primary/10 text-amber-600"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } group flex items-center rounded-md px-2 py-2 text-sm font-medium`}
              >
                <item.icon
                  className={`${
                    isCurrentPath(item.href)
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  } mr-3 h-5 w-5 flex-shrink-0`}
                  aria-hidden="true"
                />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}

            {/* Divider before Section 3 */}
            {reelsAndMerchantItems.length > 0 && (
              <div className="border-t border-border my-4"></div>
            )}

            {/* Section 3: Reels and Merchant */}
            {reelsAndMerchantItems.length > 0 && (
              <>
                {sidebarOpen && (
                  <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Reels & Market
                  </div>
                )}
                {reelsAndMerchantItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isCurrentPath(item.href)
                        ? "bg-primary/10 text-amber-600"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    } group flex items-center rounded-md px-2 py-2 text-sm font-medium`}
                  >
                    <item.icon
                      className={`${
                        isCurrentPath(item.href)
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      } mr-3 h-5 w-5 flex-shrink-0`}
                      aria-hidden="true"
                    />
                    {sidebarOpen && <span>{item.name}</span>}
                  </Link>
                ))}
              </>
            )}

            {/* Divider before Section 4 */}
            {settingsNotificationItems.length > 0 && (
              <div className="border-t border-border my-4"></div>
            )}

            {/* Section 4: Settings and Notifications */}
            {settingsNotificationItems.length > 0 && (
              <>
                {sidebarOpen && (
                  <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Other
                  </div>
                )}
                {settingsNotificationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isCurrentPath(item.href)
                        ? "bg-primary/10 text-amber-600"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    } group flex items-center rounded-md px-2 py-2 text-sm font-medium`}
                  >
                    <item.icon
                      className={`${
                        isCurrentPath(item.href)
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      } mr-3 h-5 w-5 flex-shrink-0`}
                      aria-hidden="true"
                    />
                    {sidebarOpen && <span>{item.name}</span>}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Spacer div to push content over when sidebar is fixed */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } hidden md:block flex-shrink-0 transition-all duration-500 ease-in-out`}
      ></div>

      {/* Mobile sidebar */}
      <div className="md:hidden">
        <div
          className={`fixed inset-0 z-20 flex ${
            !sidebarOpen ? "pointer-events-none" : ""
          }`}
        >
          <div
            className={`fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-500 ${
              sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className= {`relative flex w-full max-w-xs flex-1 flex-col bg-card pt-5 pb-4 transition-transform duration-500 ease-in-out z-40 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}

          >
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center">
                <LayoutDashboard className="h-6 w-6 text-primary" />
                <span className="ml-2 text-lg font-semibold">Dashboard</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
            <div className="mt-5 h-0 flex-1 overflow-y-auto">
              <nav className="space-y-1 px-2 ">
                {/* Section 1: All Properties */}
                {firstSectionItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isCurrentPath(item.href)
                        ? "bg-primary/10 text-amber-600"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    } group flex items-center rounded-md px-2 py-2 text-sm font-medium`}
                  >
                    <item.icon
                      className={`${
                        isCurrentPath(item.href)
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      } mr-3 h-5 w-5 flex-shrink-0`}
                      aria-hidden="true"
                    />
                    <span>{item.name}</span>
                  </Link>
                ))}

                {/* Divider after Section 1 */}
                {firstSectionItems.length > 0 &&
                  mainNavigationItems.length > 0 && (
                    <div className="border-t border-border my-4"></div>
                  )}

                {/* Section 2: My Property */}
                {myPropertyItems.length > 0 && (
                  <>
                    <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      My Property
                    </div>
                    {myPropertyItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${
                          isCurrentPath(item.href)
                            ? "bg-primary/10 text-amber-600"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        } group flex items-center rounded-md px-2 py-2 text-sm font-medium`}
                      >
                        <item.icon
                          className={`${
                            isCurrentPath(item.href)
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground"
                          } mr-3 h-5 w-5 flex-shrink-0`}
                          aria-hidden="true"
                        />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </>
                )}

                {/* Divider after Section 2 */}
                {myPropertyItems.length > 0 &&
                  mainNavigationItems.length > 0 && (
                    <div className="border-t border-border my-4"></div>
                  )}

                {/* Main Navigation Items */}
                {mainNavigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isCurrentPath(item.href)
                        ? "bg-primary/10 text-amber-600"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    } group flex items-center rounded-md px-2 py-2 text-sm font-medium`}
                  >
                    <item.icon
                      className={`${
                        isCurrentPath(item.href)
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      } mr-3 h-5 w-5 flex-shrink-0`}
                      aria-hidden="true"
                    />
                    <span>{item.name}</span>
                  </Link>
                ))}

                {/* Divider before Section 3 */}
                {reelsAndMerchantItems.length > 0 && (
                  <div className="border-t border-border my-4"></div>
                )}

                {/* Section 3: Reels and Merchant */}
                {reelsAndMerchantItems.length > 0 && (
                  <>
                    <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Reels & Merchant
                    </div>
                    {reelsAndMerchantItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${
                          isCurrentPath(item.href)
                            ? "bg-primary/10 text-amber-600"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        } group flex items-center rounded-md px-2 py-2 text-sm font-medium`}
                      >
                        <item.icon
                          className={`${
                            isCurrentPath(item.href)
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground"
                          } mr-3 h-5 w-5 flex-shrink-0`}
                          aria-hidden="true"
                        />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </>
                )}

                {/* Divider before Section 4 */}
                {settingsNotificationItems.length > 0 && (
                  <div className="border-t border-border my-4"></div>
                )}

                {/* Section 4: Settings and Notifications */}
                {settingsNotificationItems.length > 0 && (
                  <>
                    <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Other
                    </div>
                    {settingsNotificationItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${
                          isCurrentPath(item.href)
                            ? "bg-primary/10 text-amber-600"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        } group flex items-center rounded-md px-2 py-2 text-sm font-medium`}
                      >
                        <item.icon
                          className={`${
                            isCurrentPath(item.href)
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground"
                          } mr-3 h-5 w-5 flex-shrink-0`}
                          aria-hidden="true"
                        />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </>
                )}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

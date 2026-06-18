"use client";

import {
  CreditCard,

  Users,
  Home,
  User,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Settings,
  Building,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Axios from "@/config/axios.config";

interface MaintenanceStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  confirmed: number;
  high_priority: number;
}

interface DashboardStats {
  landlords: number;
  tenants: number;
  total_properties: number;
  pending_properties: number;
  active_leases: number;
  total_revenue: number;
  current_month_revenue: number;
  pending_payments: number;
  overdue_payments: number;
  payment_success_rate: number;
  maintenance_requests: MaintenanceStats;
}

export function StatCards() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    landlords: 0,
    tenants: 0,
    total_properties: 0,
    pending_properties: 0,
    active_leases: 0,
    total_revenue: 0,
    current_month_revenue: 0,
    pending_payments: 0,
    overdue_payments: 0,
    payment_success_rate: 0,
    maintenance_requests: {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      confirmed: 0,
      high_priority: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!session?.access) return;

        const response = await Axios.get("/users/dashboard/stats/", {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        });

        if (response.data.status === "success") {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session]);

  const firstRowCards = [
    {
      title: "Properties",
      value: loading ? "..." : stats.total_properties.toString(),
      change: `${stats.pending_properties} pending approval`,
      icon: Building,
      valueColor: "text-blue-600",
      changeColor: "text-blue-500",
    },
    {
      title: "Landlords",
      value: loading ? "..." : stats.landlords.toString(),
      change: "Total Varified landlords",
      icon: Users,
      valueColor: "text-green-600",
      changeColor: "text-green-500",
    },
    {
      title: "Tenants",
      value: loading ? "..." : stats.tenants.toString(),
      change: "Total registered tenants",
      icon: User,
      valueColor: "text-purple-600",
      changeColor: "text-purple-500",
    },
    {
      title: "Active Leases",
      value: loading ? "..." : stats.active_leases.toString(),
      change: "Currently active leases",
      icon: Home,
      valueColor: "text-indigo-600",
      changeColor: "text-indigo-500",
    },
    {
      title: "Maintenance",
      value: loading ? "..." : stats.maintenance_requests.total.toString(),
      change: `${stats.maintenance_requests.pending} pending requests`,
      icon: Settings,
      valueColor: "text-orange-600",
      changeColor: "text-orange-500",
    },
  ];

  const secondRowCards = [
    {
      title: "Total Revenue",
      value: loading ? "..." : `£${stats.total_revenue.toLocaleString()}`,
      change: "All-time revenue",
      icon: DollarSign,
      valueColor: "text-emerald-600",
      changeColor: "text-emerald-500",
    },
    {
      title: "Monthly Revenue",
      value: loading
        ? "..."
        : `£${stats.current_month_revenue.toLocaleString()}`,
      change: "Current month",
      icon: TrendingUp,
      valueColor: "text-emerald-600",
      changeColor: "text-emerald-500",
    },
    {
      title: "Payment Success Rate",
      value: loading ? "..." : `${stats.payment_success_rate}%`,
      change: "Last 30 days",
      icon: TrendingUp,
      valueColor: "text-green-600",
      changeColor: "text-green-500",
    },
    {
      title: "High Priority Issues",
      value: loading
        ? "..."
        : stats.maintenance_requests.high_priority.toString(),
      change: "Urgent attention needed",
      icon: AlertTriangle,
      valueColor: "text-red-600",
      changeColor: "text-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* First Row - Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        {firstRowCards.map((stat, index) => (
          <Card key={`first-row-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  stat.valueColor || "text-gray-900"
                }`}
              >
                {stat.value}
              </div>
              <p
                className={`text-xs ${
                  stat.changeColor || "text-muted-foreground"
                }`}
              >
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Second Row - Financial & Operational Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 ">
        {secondRowCards.map((stat, index) => (
          <Card className="w-full" key={`second-row-${index}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  stat.valueColor || "text-gray-900"
                }`}
              >
                {stat.value}
              </div>
              <p
                className={`text-xs ${
                  stat.changeColor || "text-muted-foreground"
                }`}
              >
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

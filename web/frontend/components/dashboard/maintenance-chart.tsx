"use client";

import { Wrench } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import Axios from "@/config/axios.config";

interface MaintenanceData {
  name: string;
  value: number;
  color: string;
}

export function MaintenanceChart() {
  const { data: session } = useSession();
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!session?.access) return;

        const response = await Axios.get("/users/dashboard/stats/", {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        });

        if (response.data.status === "success") {
          const stats = response.data.data.maintenance_requests;
          const chartData = [
            { name: "Pending", value: stats?.pending || 0, color: "#f59e0b" },
            {
              name: "In Progress",
              value: stats?.in_progress || 0,
              color: "#3b82f6",
            },
            {
              name: "Completed",
              value: stats?.completed || 0,
              color: "#10b981",
            },
            {
              name: "Confirmed",
              value: stats?.confirmed || 0,
              color: "#8b5cf6",
            },
          ].filter((item) => item.value > 0); // Only show categories with data

          setMaintenanceData(chartData);
        }
      } catch (error) {
        console.error("Error fetching maintenance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border rounded-lg p-2 shadow-md">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} request{data.value !== 1 ? "s" : ""}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Maintenance Requests</CardTitle>
        <CardDescription>Distribution by status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-md border border-dashed">
              <Wrench className="h-8 w-8 text-muted-foreground animate-pulse" />
              <h3 className="mt-2 text-sm font-medium">Loading...</h3>
              <p className="text-xs text-muted-foreground">
                Fetching maintenance data
              </p>
            </div>
          ) : maintenanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={maintenanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {maintenanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-sm">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-md border border-dashed">
              <Wrench className="h-8 w-8 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No Data Available</h3>
              <p className="text-xs text-muted-foreground">
                No maintenance requests to display
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

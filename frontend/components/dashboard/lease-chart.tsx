"use client";

import { FileText } from "lucide-react";
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

interface LeaseData {
  name: string;
  value: number;
  color: string;
}

export function LeaseChart() {
  const { data: session } = useSession();
  const [leaseData, setLeaseData] = useState<LeaseData[]>([]);
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
          const stats = response.data.data.lease_statistics;
          const chartData = [
            { name: "Active", value: stats?.active || 0, color: "#10b981" },
            { name: "Pending", value: stats?.pending || 0, color: "#f59e0b" },
            {
              name: "Completed",
              value: stats?.completed || 0,
              color: "#3b82f6",
            },
            {
              name: "Terminated",
              value: stats?.terminated || 0,
              color: "#ef4444",
            },
            { name: "Rejected", value: stats?.rejected || 0, color: "#6b7280" },
          ].filter((item) => item.value > 0); // Only show categories with data

          setLeaseData(chartData);
        }
      } catch (error) {
        console.error("Error fetching lease data:", error);
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
            {data.value} lease{data.value !== 1 ? "s" : ""}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="lg:col-span-1">
      <CardHeader>
        <CardTitle>Lease Overview</CardTitle>
        <CardDescription>Distribution by status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-md border border-dashed">
              <FileText className="h-8 w-8 text-muted-foreground animate-pulse" />
              <h3 className="mt-2 text-sm font-medium">Loading...</h3>
              <p className="text-xs text-muted-foreground">
                Fetching lease data
              </p>
            </div>
          ) : leaseData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leaseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {leaseData.map((entry, index) => (
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
              <FileText className="h-8 w-8 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No Data Available</h3>
              <p className="text-xs text-muted-foreground">
                No lease data to display
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

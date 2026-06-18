"use client";

import { BarChart3 } from "lucide-react";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Axios from "@/config/axios.config";

interface RevenueData {
  month: string;
  revenue: number;
}

export function RevenueChart() {
  const { data: session } = useSession();
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
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
          setRevenueData(response.data.data.revenue_trend);
        }
      } catch (error) {
        console.error("Error fetching revenue data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  };

  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Monthly revenue for the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-md border border-dashed">
              <BarChart3 className="h-8 w-8 text-muted-foreground animate-pulse" />
              <h3 className="mt-2 text-sm font-medium">Loading...</h3>
              <p className="text-xs text-muted-foreground">
                Fetching revenue data
              </p>
            </div>
          ) : revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={formatMonth} />
                <YAxis
                  tickFormatter={(value) => `£${value.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `£${value.toLocaleString()}`,
                    "Revenue",
                  ]}
                  labelFormatter={(label) => formatMonth(label)}
                />
                <Bar
                  dataKey="revenue"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-md border border-dashed">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No Data Available</h3>
              <p className="text-xs text-muted-foreground">
                No revenue data to display
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

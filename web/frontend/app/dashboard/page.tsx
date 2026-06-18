"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCards } from "@/components/dashboard/stat-cards";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { MaintenanceChart } from "@/components/dashboard/maintenance-chart";
import { LeaseChart } from "@/components/dashboard/lease-chart";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Axios from "@/config/axios.config";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (session?.role === "tenant") {
      router.push("/dashboard/properties");
    } else if (session?.role === "landlord") {
      router.push("/dashboard/landlord-lease-management");
    }
  }, [session, router]);

  const downloadMonthlyReport = async () => {
    try {
      setIsDownloading(true);

      // Download report directly from backend
      const response = await Axios.get("/users/dashboard/report/download/", {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
        responseType: "blob", // Important for file downloads
      });

      // Create and download file
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Extract filename from response headers or create default
      const contentDisposition = response.headers["content-disposition"];
      let filename = "Monthly_Report.csv";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Monthly report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error("Failed to download report. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={downloadMonthlyReport}
            disabled={isDownloading}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Downloading..." : "Download Report"}
          </Button>
        </div>
      </div>

      <StatCards />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mt-6">
        <RevenueChart />
        <RecentActivity />
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 mt-6">
        <MaintenanceChart />
        <LeaseChart />
      </div>
    </div>
  );
}

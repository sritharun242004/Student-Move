"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Ticket, CheckCircle, Clock, Users, AlertTriangle } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MerchantService,
  MerchantStats,
  MerchantStatus,
} from "@/services/merchant.service";

// const formatDateTime = (date: string) => {
//   const parsed = new Date(date);

//   if (Number.isNaN(parsed.getTime())) {
//     return "-";
//   }

//   return parsed.toLocaleString("en-GB", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };

export default function MerchantDashboardOverviewPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<MerchantStats | null>(null);
  const [merchantStatus, setMerchantStatus] = useState<MerchantStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!session?.access || session.role !== "merchant") {
        return;
      }

      try {
        setLoading(true);
        const [statsResponse, statusResponse] = await Promise.all([
          MerchantService.getMyStats(session.access),
          MerchantService.getMyStatus(session.access),
        ]);

        setStats(statsResponse);
        setMerchantStatus(statusResponse);
      } catch (error) {
        console.error("Failed to load merchant stats", error);
        toast.error("Failed to load merchant stats");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [session?.access, session?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-56">
        <p className="text-muted-foreground">Loading stats...</p>        
      </div>
    );
  }

  const successfulRedeems = stats?.successfulRedeems ?? 0;
  const failedRedeems = stats?.failedRedeems ?? 0;
  const totalRedeems = successfulRedeems + failedRedeems;

  const activeOffers = stats?.activeOffers ?? 0;
  const inactiveOffers = stats?.inactiveOffers ?? 0;
  const expiredOffers = stats?.expiredOffers ?? 0;
  const totalOffers = stats?.totalOffers ?? 0;

  const offerDistributionData = [
    {
      name: "Active",
      value: activeOffers,
      color: "var(--chart-2)",
    },
    {
      name: "Inactive",
      value: inactiveOffers,
      color: "var(--chart-4)",
    },
    {
      name: "Expired",
      value: expiredOffers,
      color: "var(--destructive)",
    },
  ];

  const redeemDistributionData = [
    {
      name: "Successful",
      value: successfulRedeems,
      color: "var(--chart-2)",
    },
    {
      name: "Failed",
      value: failedRedeems,
      color: "var(--destructive)",
    },
  ];

  const warnings: {
    key: string;
    message: string;
    isDestructive?: boolean;
  }[] = [];

  if (merchantStatus && !merchantStatus.isApproved) {
    warnings.push({
      key: "not-approved",
      message:
        "Your merchant account is pending approval. Merchant features may be limited until approval is completed. Contact support if you have any questions.",
    });
  }

  if (merchantStatus?.isSuspended) {
    warnings.push({
      key: "suspended",
      message:
        "Your merchant account is currently suspended. Please contact support for assistance.",
      isDestructive: true,
    });
  }

  if (merchantStatus && !merchantStatus.hasSecretCode) {
    warnings.push({
      key: "missing-secret-code",
      message:
        "Your secret code is not set. Set your secret code to enable secure voucher redemption. (Go to Profile > Secret Code)",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">Your merchant activity and voucher performance.</p>
      </div>

      {warnings.length > 0 && (
        <div className="space-y-3">
          {warnings.map((warning) => (
            <Alert
              key={warning.key}
              variant={warning.isDestructive ? "destructive" : "default"}
              className={!warning.isDestructive ? "border-orange-200 bg-orange-50 text-orange-800" : undefined}
            >
              <AlertTriangle className={`h-4 w-4 ${warning.isDestructive ? "" : "text-orange-600"}`} />
              <AlertDescription>{warning.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOffers ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600"> Active: {stats?.activeOffers ?? 0} </span> • <span className="text-yellow-600"> Inactive: {stats?.inactiveOffers ?? 0} </span> • <span className="text-red-600"> Expired: {stats?.expiredOffers ?? 0} </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total Redeems</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRedeems}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600"> Successful: {successfulRedeems} </span> • <span className="text-red-600"> Failed: {failedRedeems} </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total Vouchers</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVouchers ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-yellow-600"> Pending: {stats?.pendingVouchers ?? 0} </span> • <span className="text-red-600"> Expired: {stats?.expiredVouchers ?? 0} </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Students With Redeems</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudentsWithRedeems ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique students who redeemed your offers.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        
        <Card>
          <CardHeader>
            <CardTitle>Redeem Status Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">Successful vs failed redeems</p>
          </CardHeader>
          <CardContent>
            {totalRedeems > 0 ? (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={redeemDistributionData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={92}
                      cx="50%"
                      cy="50%"
                    >
                      {redeemDistributionData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[260px] w-full items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">No redeem data available yet</p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--chart-2)" }} />
                <span className="text-muted-foreground">Successful:</span>
                <span className="font-medium">{successfulRedeems}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--destructive)" }} />
                <span className="text-muted-foreground">Failed:</span>
                <span className="font-medium">{failedRedeems}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offer Status Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">Active vs inactive vs expired offers</p>
          </CardHeader>
          <CardContent>
            {totalOffers > 0 ? (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={offerDistributionData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={92}
                      cx="50%"
                      cy="50%"
                    >
                      {offerDistributionData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[260px] w-full items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">No offer data available yet</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--chart-2)" }} />
                <span className="text-muted-foreground">Active:</span>
                <span className="font-medium">{activeOffers}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--chart-4)" }} />
                <span className="text-muted-foreground">Inactive:</span>
                <span className="font-medium">{inactiveOffers}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "var(--destructive)" }} />
                <span className="text-muted-foreground">Expired:</span>
                <span className="font-medium">{expiredOffers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
      
    </div>
  );
}

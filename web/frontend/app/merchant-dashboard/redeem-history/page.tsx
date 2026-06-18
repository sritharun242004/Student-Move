"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { History, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MerchantRedemptionActivity,
  MerchantService,
} from "@/services/merchant.service";

const formatDateTime = (value?: string) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusLabel = (record: MerchantRedemptionActivity) => {
  const status = record.redeemStatus || record.voucherStatus;
  if (!status) {
    return "UNKNOWN";
  }

  return String(status).toUpperCase();
};

const getStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
  if (status.includes("SUCCESS")) {
    return "default";
  }

  if (status.includes("FAIL") || status.includes("REJECT")) {
    return "destructive";
  }

  return "secondary";
};

const getVoucherStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
  if (status.includes("PENDING")) {
    return "outline";
  }

  if (status.includes("EXPIRED")) {
    return "destructive";
  }

  if (status.includes("REDEEMED")) {
    return "default";
  }

  return "secondary";
};

const getActivityCode = (record: MerchantRedemptionActivity) => {
  return record.voucherId || "-";
};

const getStudentLabel = (record: MerchantRedemptionActivity) => {
  return record.studentId || "-";
};

export default function MerchantRedeemHistoryPage() {
  const { data: session, status } = useSession();
  const [records, setRecords] = useState<MerchantRedemptionActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isMerchant = session?.role === "merchant";

  const sortedRecords = useMemo(() => {
    return [...records].sort((first, second) => {
      const firstDate = new Date(first.scannedAt || 0).getTime();
      const secondDate = new Date(second.scannedAt || 0).getTime();
      return secondDate - firstDate;
    });
  }, [records]);

  const loadHistory = async (showLoader = true) => {
    if (!session?.access || !isMerchant) {
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const response = await MerchantService.getMyRedemptionActivity(session.access);
      setRecords(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error("Failed to load merchant redemption history", error);
      toast.error("Failed to load redemption history");
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!session?.access || !isMerchant) {
      return;
    }

    loadHistory(true);
  }, [session?.access, isMerchant]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-56">
        <p className="text-muted-foreground">Loading redeem history...</p>
      </div>
    );
  }

  if (!isMerchant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>This section is only available for merchants.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Redeem History</h2>
          <p className="text-muted-foreground">Your recent voucher redemption activity.</p>
        </div>
        <Button variant="outline" onClick={() => loadHistory(false)} disabled={refreshing}>
          {refreshing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Refreshing
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Merchant Redemption Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading activity...
            </div>
          ) : sortedRecords.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No redemption activity found.
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-3">
                {sortedRecords.map((record, index) => {
                  const statusLabel = getStatusLabel(record);
                  return (
                    <div key={`${record.voucherId || "voucher"}-${index}`} className="rounded-md border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{record.offerName || "-"}</p>
                        <Badge variant={getStatusVariant(statusLabel)}>{statusLabel}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Student: {record.studentId || "-"}</p>
                      <p className="text-sm text-muted-foreground">Voucher: {getActivityCode(record)}</p>
                      <p className="text-sm text-muted-foreground">Date: {formatDateTime(record.scannedAt)}</p>
                      {record.reason ? (
                        <p className="text-sm text-muted-foreground">Reason: {record.reason}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Offer</TableHead>
                      <TableHead>Student Id</TableHead>
                      <TableHead>Voucher Id</TableHead>
                      <TableHead>Redeem Status</TableHead>
                      <TableHead>Voucher Status</TableHead>
                      <TableHead>Scanned Date</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRecords.map((record, index) => {
                      const statusLabel = getStatusLabel(record);
                      return (
                        <TableRow key={`${record.voucherId || "voucher"}-${index}`}>
                          <TableCell>{record.offerName || "-"}</TableCell>
                          <TableCell>{record.studentId || "-"}</TableCell>
                          <TableCell>{record.voucherId?.split('-')[0] || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(statusLabel)}>{statusLabel}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getVoucherStatusVariant(record.voucherStatus || "UNKNOWN")}>
                              {record.voucherStatus || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateTime(record.scannedAt)}</TableCell>
                          <TableCell>{record.reason || "-"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

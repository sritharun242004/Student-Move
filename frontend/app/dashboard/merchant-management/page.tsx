"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Store,
  BadgeCheck,
  Ban,
  Ticket,
  Search,
  Eye,
  Loader2,
  RefreshCw,
  FileText,
  Mail,
  Phone,
  MapPin,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Merchant,
  MerchantAdminService,
  MerchantOffersResponse,
  MerchantOverviewStats,
} from "@/services/merchantAdmin.service";

const formatDate = (dateString?: string) => {
  if (!dateString) {
    return "-";
  }

  const parsedDate = new Date(dateString);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusBadge = (merchant: Merchant) => {
  if (merchant.isSuspended) {
    return <Badge variant="destructive">Suspended</Badge>;
  }

  if (merchant.isApproved) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Approved
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
      Pending Approval
    </Badge>
  );
};

export default function AdminMerchantManagementPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<MerchantOverviewStats | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all-merchants");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingMerchantId, setUpdatingMerchantId] = useState<string | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersData, setOffersData] = useState<MerchantOffersResponse | null>(null);

  const isAdmin = session?.role === "admin";

  const loadData = async (showLoader = true) => {
    if (!session?.access) {
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [overviewStats, allMerchants] = await Promise.all([
        MerchantAdminService.getOverviewStats(session.access),
        MerchantAdminService.getAllMerchants(session.access),
      ]);

      setStats(overviewStats);
      setMerchants(Array.isArray(allMerchants) ? allMerchants : []);
    } catch (error) {
      console.error("Failed to load merchant admin data:", error);
      toast.error("Failed to load merchant data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    if (!isAdmin) {
      setLoading(false);
      return;
    }

    loadData(true);
  }, [status, isAdmin, session?.access]);

  const filteredMerchants = useMemo(() => {
    if (!searchTerm.trim()) {
      return merchants;
    }

    const query = searchTerm.toLowerCase();

    return merchants.filter((merchant) => {
      return (
        merchant.businessName.toLowerCase().includes(query) ||
        merchant.businessEmail.toLowerCase().includes(query) ||
        merchant.phone.toLowerCase().includes(query)
      );
    });
  }, [merchants, searchTerm]);

  const pendingApprovalMerchants = filteredMerchants.filter(
    (merchant) => !merchant.isApproved
  );

  const handleApprovalUpdate = async (merchantId: string, isApproved: boolean) => {
    if (!session?.access) {
      return;
    }

    try {
      setUpdatingMerchantId(merchantId);
      await MerchantAdminService.updateMerchantApproval(
        merchantId,
        isApproved,
        session.access
      );
      toast.success(
        isApproved ? "Merchant approved successfully" : "Merchant approval removed"
      );
      await loadData(false);
    } catch (error) {
      console.error("Failed to update merchant approval:", error);
      toast.error("Failed to update merchant approval");
    } finally {
      setUpdatingMerchantId(null);
    }
  };

  const handleSuspensionUpdate = async (
    merchantId: string,
    isSuspended: boolean
  ) => {
    if (!session?.access) {
      return;
    }

    try {
      setUpdatingMerchantId(merchantId);
      await MerchantAdminService.updateMerchantSuspension(
        merchantId,
        isSuspended,
        session.access
      );
      toast.success(
        isSuspended ? "Merchant suspended successfully" : "Merchant unsuspended successfully"
      );
      await loadData(false);
    } catch (error) {
      console.error("Failed to update merchant suspension:", error);
      toast.error("Failed to update merchant suspension");
    } finally {
      setUpdatingMerchantId(null);
    }
  };

  const handleViewOffers = async (merchantId: string) => {
    if (!session?.access) {
      return;
    }

    try {
      const merchant = merchants.find((item) => item.id === merchantId) || null;
      setSelectedMerchant(merchant);
      setActiveTab("merchant-details");
      setOffersLoading(true);
      setOffersData(null);
      const merchantOffers = await MerchantAdminService.getOffersByMerchantId(
        merchantId,
        session.access
      );
      setOffersData(merchantOffers);
    } catch (error) {
      console.error("Failed to load merchant offers:", error);
      toast.error("Failed to load merchant offers");
      setOffersData(null);
    } finally {
      setOffersLoading(false);
    }
  };

  const renderMerchantRows = (rows: Merchant[]) => {
    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
            No merchants found
          </TableCell>
        </TableRow>
      );
    }

    return rows.map((merchant) => {
      const isRowUpdating = updatingMerchantId === merchant.id;

      return (
        <TableRow key={merchant.id}>
          <TableCell className="font-medium">{merchant.businessName}</TableCell>
          <TableCell>{merchant.businessEmail}</TableCell>
          <TableCell>{merchant.phone}</TableCell>
          <TableCell>{statusBadge(merchant)}</TableCell>
          <TableCell>{merchant.offerCounts?.active ?? 0}</TableCell>
          <TableCell>{merchant.offerCounts?.all ?? 0}</TableCell>
          <TableCell>{formatDate(merchant.createdAt)}</TableCell>
          <TableCell>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewOffers(merchant.id)}
                disabled={isRowUpdating}
              >
                <Eye className="h-4 w-4 mr-1" />
                See Offers
              </Button>
              {!merchant.isApproved && (
                <Button
                  size="sm"
                  onClick={() => handleApprovalUpdate(merchant.id, true)}
                  disabled={isRowUpdating}
                >
                  {isRowUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Approve"
                  )}
                </Button>
              )}
              <Button
                size="sm"
                variant={merchant.isSuspended ? "outline" : "destructive"}
                onClick={() =>
                  handleSuspensionUpdate(merchant.id, !merchant.isSuspended)
                }
                disabled={isRowUpdating}
              >
                {merchant.isSuspended ? "Unsuspend" : "Suspend"}
              </Button>
            </div>
          </TableCell>
        </TableRow>
      );
    });
  };

  if (loading || status === "loading") {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading merchants...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>
              You need admin access to view merchant management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Merchant Management</h1>
          <p className="text-muted-foreground mt-1">
            Review merchants, approvals, suspensions, and offer activity.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => loadData(false)}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMerchants ?? merchants.length}</div>
            <p className="text-xs text-muted-foreground mt-1"><span className="text-green-600 mr-2">{stats?.approvedMerchants} Approved</span> <span className="text-red-600">{stats?.suspendedMerchants} Suspended</span></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total Offers</CardTitle>
            <BadgeCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalOffers ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1"><span className="text-green-600 mr-2">{stats?.activeOffers} Active</span> <span className="mr-2">{stats?.inactiveOffers} Inactive</span> <span className="text-red-600">{stats?.expiredOffers} Expired</span> </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total Redeems</CardTitle>
             <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.successfulRedeems ?? 0) + (stats?.failedRedeems ?? 0)}</div>
            <p className="text-xs text-muted-foreground mt-1"> <span className="text-green-600 mr-2">{stats?.successfulRedeems ?? 0} Successful</span> <span className="text-red-600">{stats?.failedRedeems ?? 0} Failed</span></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Total Students(Used) </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudentsWithRedeems ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1"> <span className="text-green-600 mr-2">{stats?.redeemedVouchers ?? 0} Redeemed Vouchers</span> <span className="text-red-600">{stats?.expiredVouchers ?? 0} Expired Vouchers</span></p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by business name, email, or phone"
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending-approval">
            Pending Approval ({pendingApprovalMerchants.length})
          </TabsTrigger>
          <TabsTrigger value="all-merchants">
            All Merchants ({filteredMerchants.length})
          </TabsTrigger>
          <TabsTrigger value="merchant-details">Merchant Details</TabsTrigger>
        </TabsList>

        <TabsContent value="pending-approval">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approval</CardTitle>
              <CardDescription>
                Merchants waiting for admin approval.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Active Offers</TableHead>
                      <TableHead>Total Offers</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{renderMerchantRows(pendingApprovalMerchants)}</TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-merchants">
          <Card>
            <CardHeader>
              <CardTitle>All Merchants</CardTitle>
              <CardDescription>
                Full merchant list with approval and suspension controls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Active Offers</TableHead>
                      <TableHead>Total Offers</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{renderMerchantRows(filteredMerchants)}</TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="merchant-details" className="space-y-4">
          {selectedMerchant ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>{selectedMerchant.businessName}</CardTitle>
                      <CardDescription>
                        Full merchant profile and offer activity
                      </CardDescription>
                    </div>
                    {statusBadge(selectedMerchant)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <span>{selectedMerchant.businessEmail || "-"}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <span>{selectedMerchant.phone || "-"}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <span>{selectedMerchant.address || "-"}</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Created:</span>{" "}
                        {formatDate(selectedMerchant.createdAt)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Updated:</span>{" "}
                        {formatDate(selectedMerchant.updatedAt)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Offer Counts:</span>{" "}
                        Active {selectedMerchant.offerCounts?.active ?? 0} / Total{" "}
                        {selectedMerchant.offerCounts?.all ?? 0}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedMerchant.description || "No description provided."}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Merchant Offers</CardTitle>
                  <CardDescription>
                    {offersData
                      ? `Total: ${offersData.summary.totalOffers} • Active: ${offersData.summary.activeOffers} • Inactive: ${offersData.summary.inactiveOffers} • Expired: ${offersData.summary.expiredOffers}`
                      : "Offer breakdown for selected merchant"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {offersLoading ? (
                    <div className="py-10 flex justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : offersData?.offers?.length ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Discount Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Per Student Limit</TableHead>
                            <TableHead>Expiry</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {offersData.offers.map((offer) => (
                            <TableRow key={offer.id}>
                              <TableCell className="font-medium">{offer.title}</TableCell>
                              <TableCell>{offer.discountType}</TableCell>
                              <TableCell>
                                {offer.isActive ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-green-50 text-green-700 border-green-200"
                                  >
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Inactive</Badge>
                                )}
                              </TableCell>
                              <TableCell>{offer.usedCount ?? 0} / {offer.usageLimit ?? "-"}</TableCell>
                              <TableCell>{offer.perStudentLimit ?? "-"}</TableCell>
                              <TableCell>{formatDate(offer.expiryDate)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No offers found for this merchant.
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No merchant selected</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Click See Offers from any merchant row to view full merchant details
                  and offer list here.
                </p>
                <Button variant="outline" onClick={() => setActiveTab("all-merchants")}>
                  View All Merchants
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

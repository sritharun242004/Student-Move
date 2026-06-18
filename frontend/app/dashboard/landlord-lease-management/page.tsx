"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  AlertCircle,
  Eye,
  DollarSign,
  Send,
  Mail,
  Search,
  MoreHorizontal,
  Building,
  Wrench,
  Plus,
  Upload,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { Lease, LeaseStatus } from "@/types/leaseType";
import { LandlordGuard } from "@/components/dashboard/landlord-guard";
import { useAgentAxios } from "@/hooks/useAgentAxios";
import { useLandlordContext } from "@/app/store/useLandlordContext";

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, "PPP"); // e.g., "April 29, 2023"
};

// Calculate days remaining in lease
const calculateDaysRemaining = (endDate: string) => {
  const end = new Date(endDate);
  const today = new Date();
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Status badge component
const LeaseStatusBadge = ({ status }: { status: LeaseStatus }) => {
  switch (status) {
    case "active":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
          Active
        </Badge>
      );
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          <Clock className="h-3.5 w-3.5 mr-1" />
          Pending
        </Badge>
      );
    case "rejected":
      return (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200"
        >
          <AlertCircle className="h-3.5 w-3.5 mr-1" />
          Rejected
        </Badge>
      );
    case "tenant_closed":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <XCircle className="h-3.5 w-3.5 mr-1" />
          Tenant Closed
        </Badge>
      );
    case "landlord_closed":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <XCircle className="h-3.5 w-3.5 mr-1" />
          Landlord Closed
        </Badge>
      );
    case "terminated":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <XCircle className="h-3.5 w-3.5 mr-1" />
          Terminated
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <XCircle className="h-3.5 w-3.5 mr-1" />
          Completed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function LandlordLeaseManagement() {
  const { data: session } = useSession();
  const { selectedLandlord } = useLandlordContext();
  const axios = useAgentAxios();
  const [loading, setLoading] = useState(true);
  const [leases, setLease] = useState<Lease[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all-leases");
  const [selectedLease, setSelectedLease] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [terminationDialogOpen, setTerminationDialogOpen] = useState(false);
  const [deleteLeaseDialogOpen, setDeleteLeaseDialogOpen] = useState(false);

  const [renewalResponse, setRenewalResponse] = useState("");
  const [renewalNotes, setRenewalNotes] = useState("");
  const [terminationResponse, setTerminationResponse] = useState("");
  const [terminationNotes, setTerminationNotes] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] =
    useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [documentNotes, setDocumentNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(false);

  // Filter leases based on search query, status filter, and property filter
  const filteredLeases = leases.filter((lease) => {
    const matchesSearch =
      lease.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      lease.property.address
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      lease.tenant.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      lease.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesProperty =
      propertyFilter === "all" ||
      lease.property.id.toString().toLowerCase() ===
        propertyFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesProperty;
  });

  // Calculate lease statistics - use dashboard stats if available, otherwise fallback to local calculations
  const totalLeases = dashboardStats?.leases?.total || leases.length;
  const activeLeases =
    dashboardStats?.leases?.active ||
    leases.filter((lease) => lease.status === "active").length;
  const endingSoonLeases =
    dashboardStats?.leases?.ending_soon ||
    leases.filter((lease) => lease.status === "pending").length;
  const pendingLeases =
    dashboardStats?.leases?.pending ||
    leases.filter((lease) => lease.status === "pending").length;

  // Property statistics
  const totalProperties =
    dashboardStats?.properties?.total || properties.length;
  const occupancyRate =
    dashboardStats?.properties?.occupancy_rate ||
    (totalProperties > 0
      ? Math.round((activeLeases / totalProperties) * 100)
      : 0);

  // Maintenance statistics
  const activeMaintanceRequests = dashboardStats?.maintenance?.active || 0;

  // Financial statistics
  const totalRentValue =
    dashboardStats?.financial?.monthly_revenue ||
    leases
      .filter((lease) => lease.status === "active")
      .reduce((sum, lease) => sum + lease.installmentAmount, 0);

  // const handleRefresh = () => {
  //   setIsRefreshing(true);
  //   // Simulate data refresh
  //   setTimeout(() => {
  //     setIsRefreshing(false);
  //   }, 1000);
  // };

  const handleRenewalResponse = () => {
    // Here you would handle the renewal response submission
    setRenewalDialogOpen(false);
  };

  const handleTerminationResponse = () => {
    setTerminationDialogOpen(false);
  };

  const handleDeleteLease = async () => {
    if (!selectedLease) {
      toast.error("No lease selected");
      return;
    }

    setIsDeleting(true);
    try {
      await axios.delete(`/tenants/requests/${selectedLease.id}/`);
      
      toast.success("Lease deleted successfully");
      
      // Clear selected lease and refresh the list
      setSelectedLease(null);
      setActiveTab("all-leases");
      fetchLeases();
      setDeleteLeaseDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting lease:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete lease. Please try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get("/tenants/dashboard/stats/");
      setDashboardStats(response.data.data);
    } catch (err: any) {
      console.error("Error fetching dashboard stats:", err);
      console.error("Error response:", err.response?.data);
    }
  };

  const fetchLeases = async () => {
    try {
      const response = await axios.get("/tenants/requests/");
      let leasesData = response.data.data;
      // Handle pagination case
      if (!Array.isArray(leasesData) && leasesData.results) {
        leasesData = leasesData.results;
      }
      setLease(Array.isArray(leasesData) ? leasesData : []);
      setLoading(false);
    } catch (err) {
      // setError(err.message);
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await axios.get("/properties/");
      setProperties(
        Array.isArray(response.data.data) ? response.data.data : []
      );
      setLoading(false);
    } catch (err) {
      // setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      session &&
      (session.role === "landlord" ||
        (session.role === "agent" && selectedLandlord))
    ) {
      fetchDashboardStats();
      fetchLeases();
      fetchProperties();
    }
  }, [session, selectedLandlord]);

  useEffect(() => {
    if (selectedLease) {
      fetchDocuments();
      fetchPaymentHistory();
    }
  }, [selectedLease]);

  async function ChangeStatusApprove() {
    if (
      !selectedLease ||
      (session?.role !== "landlord" && session?.role !== "agent")
    ) {
      console.error("Not Authenticated or No lease selected to change status.");
      return;
    }

    try {
      const response = await axios.patch(
        `/tenants/requests/${selectedLease.id}/approve/`,
        { status: "active" }
      );
      fetchLeases(); // Refresh the lease list after status change
      // Update the selected lease with the new status
      setSelectedLease({ ...selectedLease, status: "active" });
    } catch (error) {
      console.error("Error updating lease status:", error);
    }
  }

  const downloadMonthlyReport = async () => {
    try {
      setIsDownloading(true);

      // Download landlord-specific report directly from backend
      const response = await axios.get("/tenants/requests/report/download/", {
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

      toast.success("Lease report downloaded successfully!");
    } catch (error) {
      console.error("Error downloading lease report:", error);
      toast.error("Failed to download lease report. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!selectedLease) return;

    setIsLoadingDocuments(true);
    try {
      const response = await axios.get(
        `/tenants/documents/${selectedLease.id}/`,
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        }
      );
      setDocuments(response.data);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const fetchPaymentHistory = async () => {
    if (!selectedLease) return;

    setIsLoadingPayments(true);
    try {
      const response = await axios.get(
        `/tenants/payments/lease/${selectedLease.id}/rent-history/`,
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        }
      );
      // Handle both array and object responses
      const data = response.data.data || response.data;
      setPaymentHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching payment history:", err);
      setPaymentHistory([]);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleDocumentDownload = async (
    documentId: number,
    filename: string
  ) => {
    try {
      const response = await axios.get(
        `/tenants/documents/download/${documentId}/`,
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
          responseType: "blob",
        }
      );

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading document:", err);
      toast("Error", {
        description: "Failed to download document. Please try again.",
      });
    }
  };

  const handleDocumentUpload = async () => {
    if (!selectedFile || !documentType || !selectedLease) {
      toast("Error", {
        description: "Please select a file and document type.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("document_type", documentType);
      formData.append("notes", documentNotes);
      formData.append("lease_id", selectedLease.id.toString());

      const response = await axios.post("/tenants/upload-document/", formData, {
        headers: {
          Authorization: `Bearer ${session?.access}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast("Success", {
        description: "Document uploaded successfully!",
      });

      // Reset form and refresh documents list
      setSelectedFile(null);
      setDocumentType("");
      setDocumentNotes("");
      setUploadDocumentDialogOpen(false);
      fetchDocuments(); // Refresh the documents list
    } catch (err: any) {
      console.error(
        "Error uploading document:",
        err.response?.data || err.message
      );
      toast("Error", {
        description: "Failed to upload document. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    try {
      await axios.delete(`/tenants/documents/delete/${documentId}/`, {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
      });

      toast("Success", {
        description: "Document deleted successfully!",
      });

      // Refresh the documents list
      fetchDocuments();
    } catch (err) {
      console.error("Error deleting document:", err);
      toast("Error", {
        description: "Failed to delete document. Please try again.",
      });
    }
  };

  return (
    <LandlordGuard>
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Overview</h1>
            <p className="text-muted-foreground">
              See your Stats and Manage all your property leases
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => (window.location.href = "/dashboard/property-add")}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
            <Button
              onClick={downloadMonthlyReport}
              disabled={isDownloading}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "Downloading..." : "Download Lease Report"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Properties
              </CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProperties}</div>
              <div className="text-xs text-muted-foreground">
                {dashboardStats?.properties?.approved || 0} approved,{" "}
                {dashboardStats?.properties?.pending || 0} pending
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Leases
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLeases}</div>
              <div className="text-xs text-muted-foreground">
                {activeLeases} active, {pendingLeases} pending
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Occupancy Rate
              </CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{occupancyRate}%</div>
              <div className="text-xs text-muted-foreground">
                {activeLeases} of {totalProperties} properties occupied
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Weekly Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                £{totalRentValue.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                From {activeLeases} active leases
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Maintenance Requests
              </CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeMaintanceRequests}
              </div>
              <div className="text-xs text-muted-foreground">
                {dashboardStats?.maintenance?.pending || 0} pending,{" "}
                {dashboardStats?.maintenance?.in_progress || 0} in progress
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Financial Summary
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                £
                {(
                  dashboardStats?.financial?.total_collected || 0
                ).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                Total collected • £
                {(
                  dashboardStats?.financial?.pending_payments || 0
                ).toLocaleString()}{" "}
                pending
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs
          defaultValue="all-leases"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all-leases" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">All Leases</span>
              <span className="sm:hidden">Leases</span>
            </TabsTrigger>

            <TabsTrigger value="details" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Lease Details</span>
              <span className="sm:hidden">Details</span>
            </TabsTrigger>

            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
              <span className="sm:hidden">Documents</span>
            </TabsTrigger>
          </TabsList>

          {/* All Leases Tab */}
          <TabsContent value="all-leases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lease Agreements</CardTitle>
                <CardDescription>
                  Manage all your property lease agreements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search by lease ID, property, or tenant..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="tenant_closed">
                          Tenant Closed
                        </SelectItem>
                        <SelectItem value="landlord_closed">
                          Landlord Closed
                        </SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={propertyFilter}
                      onValueChange={setPropertyFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by property" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Properties</SelectItem>
                        {properties.map((property) => (
                          <SelectItem
                            key={property.id}
                            value={property.id.toString().toLowerCase()}
                          >
                            {property.address.split(",")[0]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lease ID</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Rent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeases.map((lease) => (
                        <TableRow
                          key={lease.id}
                          onClick={() => {
                            setSelectedLease(lease);
                            setActiveTab("details");
                          }}
                          className="cursor-pointer"
                        >
                          <TableCell className="font-medium">
                            {lease.id}
                          </TableCell>
                          <TableCell>
                            <div
                              className="max-w-[200px] truncate"
                              title={lease.property.address}
                            >
                              {lease.property.address.split(",")[0]}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {/* {lease.propertyType} */}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage alt={lease.tenant.name} />
                                <AvatarFallback>
                                  {lease.tenant.name.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {lease.tenant.name}
                                </div>
                                {/* {lease.tenants.length > 1 && (
                                <div className="text-xs text-muted-foreground">
                                  +{lease.tenants.length - 1} more
                                </div>
                              )} */}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{formatDate(lease.startDate)}</div>
                            <div>{formatDate(lease.end_date)}</div>
                          </TableCell>
                          <TableCell>
                            £{(lease.monthly_rent || lease.installmentAmount)}/month
                          </TableCell>
                          <TableCell>
                            <LeaseStatusBadge status={lease.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedLease(lease);
                                    setActiveTab("details");
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download agreement
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="mr-2 h-4 w-4" />
                                  Contact tenant
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredLeases.length} of {filteredLeases.length}{" "}
                  leases
                </div>
                {/* <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <FileUp className="mr-2 h-4 w-4" />
                  Bulk Upload
                </Button>
              </div> */}
              </CardFooter>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Leases Ending Soon</CardTitle>
                  <CardDescription>
                    Leases that will expire in the next 60 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {leases.filter((lease) => lease.status === "pending").length >
                  0 ? (
                    <div className="space-y-4">
                      {leases
                        .filter((lease) => lease.status === "pending")
                        .map((lease) => {
                          const daysRemaining = calculateDaysRemaining(
                            lease.end_date
                          );
                          return (
                            <div
                              key={lease.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                  <Calendar className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {lease.property.address.split(",")[0]}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {lease.tenant.name} • Ends{" "}
                                    {formatDate(lease.end_date)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <Badge
                                  variant="outline"
                                  className="bg-orange-50 text-orange-700 border-orange-200"
                                >
                                  {daysRemaining} days left
                                </Badge>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="h-auto p-0 mt-1"
                                >
                                  Send reminder
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <CheckCircle className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">
                        No leases ending soon
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lease Statistics</CardTitle>
                  <CardDescription>
                    Overview of your lease portfolio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                          <span>Active Leases</span>
                        </div>
                        <div>
                          {activeLeases} (
                          {Math.round((activeLeases / totalLeases) * 100)}%)
                        </div>
                      </div>
                      <Progress
                        value={(activeLeases / totalLeases) * 100}
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                          <span>Pending</span>
                        </div>
                        <div>
                          {pendingLeases} (
                          {Math.round((pendingLeases / totalLeases) * 100)}%)
                        </div>
                      </div>
                      <Progress
                        value={(pendingLeases / totalLeases) * 100}
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                          <span>Expired/Terminated</span>
                        </div>
                        <div>
                          {totalLeases - activeLeases - pendingLeases} (
                          {Math.round(
                            ((totalLeases - activeLeases - pendingLeases) /
                              totalLeases) *
                              100
                          )}
                          %)
                        </div>
                      </div>
                      <Progress
                        value={
                          ((totalLeases - activeLeases - pendingLeases) /
                            totalLeases) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Lease Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {selectedLease ? (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle>Lease Information</CardTitle>
                          <CardDescription>
                            Details about the selected lease
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <LeaseStatusBadge status={selectedLease.status} />
                          {selectedLease.status === "pending" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Button
                                    variant="destructive"
                                    className="cursor-pointer"
                                    size="sm"
                                    disabled={!selectedLease.admin_signed}
                                    onClick={ChangeStatusApprove}
                                  >
                                    Approve
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              {!selectedLease.admin_signed && (
                                <TooltipContent>
                                  <p>Cannot approve: Agreement not signed by admin</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Lease ID
                          </h3>
                          <p className="font-medium">{selectedLease.id}</p>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Property
                          </h3>
                          <p className="font-medium">
                            {selectedLease.property.address}
                          </p>
                          {/* <p className="text-sm text-muted-foreground mt-1">
                          {selectedLease.propertyType}
                        </p> */}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              Start Date
                            </h3>
                            <p>{formatDate(selectedLease.startDate)}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              End Date
                            </h3>
                            <p>{formatDate(selectedLease.end_date)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              Monthly Rent
                            </h3>
                            <p className="font-medium">
                              £{selectedLease.monthly_rent || selectedLease.installmentAmount}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              Holding Fee
                            </h3>
                            <p>£{selectedLease.holding_fee || selectedLease.property.security_deposit}</p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Tenant
                          </h3>
                          <div className="space-y-3">
                            <div
                              key={selectedLease.tenant.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage
                                    src={
                                      selectedLease.tenant.avatar ||
                                      "/placeholder.svg"
                                    }
                                    alt={selectedLease.tenant.name}
                                  />
                                  <AvatarFallback>
                                    {selectedLease.tenant.name.substring(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">
                                    {selectedLease.tenant.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedLease.tenant.email}
                                  </p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                <Mail className="mr-2 h-4 w-4" />
                                Contact
                              </Button>
                            </div>
                          </div>
                        </div>

                        {selectedLease.notes && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              Notes
                            </h3>
                            <p className="p-3 bg-muted rounded-md">
                              {selectedLease.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Payment History</CardTitle>
                      <CardDescription>
                        Rent payment history for this lease
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingPayments ? (
                        <div className="flex items-center justify-center py-8">
                          <Clock className="h-6 w-6 animate-spin mr-2" />
                          <span>Loading payment history...</span>
                        </div>
                      ) : paymentHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-medium mb-2">No payments yet</h3>
                          <p className="text-sm text-muted-foreground">
                            Rent payments will appear here once they are processed
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Reference</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paymentHistory.map((payment) => (
                                <TableRow key={payment.id}>
                                  <TableCell>
                                    {formatDate(payment.createdAt || payment.created_at)}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {payment.stripeChargeId || payment.stripe_charge_id || 
                                     payment.stripePaymentIntentId || payment.stripe_payment_intent_id || 
                                     '-'}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    £{parseFloat(payment.amount).toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={
                                        payment.status === 'success'
                                          ? 'bg-green-50 text-green-700 border-green-200'
                                          : payment.status === 'pending'
                                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                          : 'bg-red-50 text-red-700 border-red-200'
                                      }
                                    >
                                      {payment.status === 'success' && (
                                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                      )}
                                      {payment.status === 'pending' && (
                                        <Clock className="h-3.5 w-3.5 mr-1" />
                                      )}
                                      {payment.status === 'failed' && (
                                        <XCircle className="h-3.5 w-3.5 mr-1" />
                                      )}
                                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">

                  <Card>
                    <CardHeader>
                      <CardTitle>Lease Timeline</CardTitle>
                      <CardDescription>
                        Key dates for this lease
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">Lease Start</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(selectedLease.startDate)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium">Lease End</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(selectedLease.end_date)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Delete Lease</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Deleting a lease is permanent and cannot be undone. This action will remove all records of the lease agreement, including tenant information and payment history. Please proceed with caution.
                      </p>
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setDeleteLeaseDialogOpen(true)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-muted p-3 mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    No lease selected
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    Select a lease from the All Leases tab to view details.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("all-leases")}
                  >
                    View All Leases
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            {selectedLease ? (
              <>
                {/* Agreement Forms Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Agreement Forms</CardTitle>
                    <CardDescription>
                      View the forms that were completed to create this lease
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={() => window.open(`/dashboard/forms/view/application?leaseId=${selectedLease.id}`, '_blank')}
                      >
                        <FileText className="h-8 w-8 text-blue-600" />
                        <span className="font-medium">Application Form</span>
                        <span className="text-sm text-muted-foreground">Tenant application details</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={() => window.open(`/dashboard/forms/view/guarantor?leaseId=${selectedLease.id}`, '_blank')}
                      >
                        <Shield className="h-8 w-8 text-green-600" />
                        <span className="font-medium">Guarantor Form</span>
                        <span className="text-sm text-muted-foreground">Guarantor details and signatures</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={() => window.open(`/dashboard/forms/view/agreement-1?leaseId=${selectedLease.id}`, '_blank')}
                      >
                        <FileText className="h-8 w-8 text-purple-600" />
                        <span className="font-medium">Rental Agreement</span>
                        <span className="text-sm text-muted-foreground">Fixed term tenancy</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={() => window.open(`/dashboard/forms/view/agreement?leaseId=${selectedLease.id}`, '_blank')}
                      >
                        <FileText className="h-8 w-8 text-orange-600" />
                        <span className="font-medium">Utility Agreement</span>
                        <span className="text-sm text-muted-foreground">Utilities inclusive terms</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Upload Documents Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Upload Documents</CardTitle>
                      <CardDescription>
                        Upload lease-related documents for record keeping
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        className="w-full"
                        onClick={() => setUploadDocumentDialogOpen(true)}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload New Document
                      </Button>
                    </CardContent>
                  </Card>

                  {/* View Documents Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Document Summary</CardTitle>
                      <CardDescription>
                        Overview of documents for this lease
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Documents</span>
                          <span className="text-sm font-medium">{documents.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Agreement Forms</span>
                          <span className="text-sm font-medium">3</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Documents List */}
                <Card>
                  <CardHeader>
                    <CardTitle>Lease Documents</CardTitle>
                    <CardDescription>
                      All documents related to this lease agreement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingDocuments ? (
                      <div className="flex items-center justify-center py-8">
                        <Clock className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading documents...</span>
                      </div>
                    ) : documents.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-medium mb-2">No documents uploaded</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload your first document to get started
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => setUploadDocumentDialogOpen(true)}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Document
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Document Name</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Uploaded By</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {documents.map((document) => (
                              <TableRow key={document.id}>
                                <TableCell className="font-medium">
                                  {document.file_name}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {document.document_type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {document.uploaded_by === 'tenant' ? 'Tenant' : 'Landlord'}
                                </TableCell>
                                <TableCell>
                                  {formatDate(document.uploaded_at)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDocumentDownload(document.id, document.file_name)}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <XCircle className="h-4 w-4 text-red-500" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete this document? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDocumentDelete(document.id.toString())}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
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
                  <h3 className="text-lg font-medium mb-2">
                    No lease selected
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    Select a lease from the All Leases tab to view documents.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("all-leases")}
                  >
                    View All Leases
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Renewal Response Dialog */}
        <Dialog open={renewalDialogOpen} onOpenChange={setRenewalDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Respond to Renewal Request</DialogTitle>
              <DialogDescription>
                Respond to the tenant's lease renewal request. You can approve,
                reject, or propose new terms.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="renewal-response">Response</Label>
                <Select
                  value={renewalResponse}
                  onValueChange={setRenewalResponse}
                >
                  <SelectTrigger id="renewal-response">
                    <SelectValue placeholder="Select your response" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve Renewal</SelectItem>
                    <SelectItem value="approve-with-changes">
                      Approve with Changes
                    </SelectItem>
                    <SelectItem value="reject">Reject Renewal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {renewalResponse === "approve-with-changes" && (
                <div className="grid gap-2">
                  <Label htmlFor="new-rent">New Monthly Rent (£)</Label>
                  <Input
                    id="new-rent"
                    type="number"
                    placeholder="Enter new rent amount"
                    defaultValue={selectedLease?.rentAmount}
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="renewal-notes">Additional Notes</Label>
                <Textarea
                  id="renewal-notes"
                  placeholder="Provide additional details about your response..."
                  rows={4}
                  value={renewalNotes}
                  onChange={(e) => setRenewalNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRenewalDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleRenewalResponse}>
                <Send className="mr-2 h-4 w-4" />
                Send Response
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Termination Response Dialog */}
        <Dialog
          open={terminationDialogOpen}
          onOpenChange={setTerminationDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Respond to Termination Request</DialogTitle>
              <DialogDescription>
                Respond to the tenant's lease termination request. You can
                approve or reject the request.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="termination-response">Response</Label>
                <Select
                  value={terminationResponse}
                  onValueChange={setTerminationResponse}
                >
                  <SelectTrigger id="termination-response">
                    <SelectValue placeholder="Select your response" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approve">Approve Termination</SelectItem>
                    <SelectItem value="reject">Reject Termination</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="termination-notes">Additional Notes</Label>
                <Textarea
                  id="termination-notes"
                  placeholder="Provide additional details about your response..."
                  rows={4}
                  value={terminationNotes}
                  onChange={(e) => setTerminationNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setTerminationDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleTerminationResponse}>
                <Send className="mr-2 h-4 w-4" />
                Send Response
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upload Document Dialog */}
        <Dialog
          open={uploadDocumentDialogOpen}
          onOpenChange={setUploadDocumentDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload lease-related documents for record keeping.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="document-type">Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger id="document-type">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lease_agreement">Lease Agreement</SelectItem>
                    <SelectItem value="maintenance_report">Maintenance Report</SelectItem>
                    <SelectItem value="inspection_report">Inspection Report</SelectItem>
                    <SelectItem value="correspondence">Correspondence</SelectItem>
                    <SelectItem value="financial_document">Financial Document</SelectItem>
                    <SelectItem value="legal_document">Legal Document</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="document-file">Select File</Label>
                <Input
                  id="document-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="document-notes">Notes (Optional)</Label>
                <Textarea
                  id="document-notes"
                  placeholder="Any additional notes about this document..."
                  rows={3}
                  value={documentNotes}
                  onChange={(e) => setDocumentNotes(e.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG. Maximum
                  file size: 10MB.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUploadDocumentDialogOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDocumentUpload}
                disabled={isUploading || !selectedFile || !documentType}
              >
                {isUploading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Lease Dialog */}
        <AlertDialog open={deleteLeaseDialogOpen} onOpenChange={setDeleteLeaseDialogOpen}>
          <AlertDialogContent className="sm:max-w-[500px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">Delete Lease</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-3">
              <div className="font-semibold text-foreground">
                Are you absolutely sure you want to delete this lease?
              </div>
              <div className="text-sm">
                This action cannot be undone. Deleting this lease will permanently remove:
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm ml-2">
                <li>Lease agreement and all associated documents</li>
                <li>Payment history and transaction records</li>
                <li>Maintenance requests linked to this lease</li>
                <li>Inspection records and schedules</li>
                <li>All installment records</li>
              </ul>
              {selectedLease && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200 mt-4">
                  <div className="text-sm font-medium text-red-900">
                    Lease ID: <span className="font-mono">{selectedLease.id}</span>
                  </div>
                  <div className="text-sm text-red-800 mt-1">
                    Tenant: <span className="font-medium">{selectedLease.tenant.name}</span>
                  </div>
                  <div className="text-sm text-red-800">
                    Property: <span className="font-medium">{selectedLease.property.address}</span>
                  </div>
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteLease}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Delete Lease
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </LandlordGuard>
  );
}

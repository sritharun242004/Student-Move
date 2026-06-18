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
  ExternalLink,
  Home,
  DollarSign,
  Shield,
  CalendarRange,
  CalendarX,
  Send,
  Mail,
  Phone,
  StopCircle,
  Upload,
  Trash2,
  Banknote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Axios from "@/config/axios.config";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useRouter } from "next/navigation";
import { Lease } from "@/types/leaseType";
// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Invalid Date"; // Handle invalid date
  }
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

// Calculate lease progress
const calculateLeaseProgress = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();

  // If the lease hasn't started yet, progress is 0%
  if (today < start) {
    return 0;
  }

  const totalLeaseDuration = end.getTime() - start.getTime();
  const elapsedDuration = today.getTime() - start.getTime();

  const progress = (elapsedDuration / totalLeaseDuration) * 100;
  return Math.max(0, Math.min(100, progress)); // Clamp between 0 and 100
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
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
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          <Clock className="h-3.5 w-3.5 mr-1" />
          Pending
        </Badge>
      );
    case "rejected":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <XCircle className="h-3.5 w-3.5 mr-1" />
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
          className="bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle className="h-3.5 w-3.5 mr-1" />
          Completed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function TenantLeaseManagement() {
  const { data: session } = useSession();

  const [currentLease, setCurrentLease] = useState<Lease | null>(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [renewalDialogOpen, setRenewalDialogOpen] = useState(false);
  const [terminationDialogOpen, setTerminationDialogOpen] = useState(false);
  const [renewalPeriod, setRenewalPeriod] = useState("12");
  const [renewalNotes, setRenewalNotes] = useState("");
  const [terminationDate, setTerminationDate] = useState<Date | undefined>(
    new Date(currentLease?.end_date || "")
  );
  const [terminationReason, setTerminationReason] = useState("");
  const [terminationNotes, setTerminationNotes] = useState("");
  const [installments, setInstallments] = useState<any[]>([]);
  const [payment_id, setPaymentId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] =
    useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [documentNotes, setDocumentNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  const daysRemaining = calculateDaysRemaining(currentLease?.end_date || "");
  const leaseProgress = calculateLeaseProgress(
    currentLease?.startDate || "",
    currentLease?.end_date || ""
  );

  const router = useRouter();

  const fetchLease = async () => {
    try {
      const response = await Axios.get("/tenants/requests/active/", {
        headers: {
          Authorization: `Bearer ${session?.access}`, // Use token from session
        },
      });
      const leaseData = response.data.data;

      setCurrentLease(leaseData);
    } catch (err) {
      setCurrentLease(null);
    }
  };
  const fetchInstallments = async () => {
    if (!currentLease) return;
    try {
      //ge by lease id: update later
      const response = await Axios.get(
        `/tenants/installments-list/${currentLease.id}/`,
        {
          headers: {
            Authorization: `Bearer ${session?.access}`, // Use token from session
          },
        }
      );
      // const installments = response.data.data;
      setInstallments(response.data.data);
    } catch (err) {
      console.error("Error fetching lease data:", err);
    }
  };

  const fetchDocuments = async () => {
    if (!currentLease) return;

    setIsLoadingDocuments(true);
    try {
      const response = await Axios.get(
        `/tenants/documents/${currentLease.id}/`,
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

  const handleDocumentDownload = async (
    documentId: number,
    filename: string
  ) => {
    try {
      const response = await Axios.get(
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
  useEffect(() => {
    if (!session?.access) return;

    fetchLease();
  }, [session]);

  useEffect(() => {
    fetchInstallments();
    fetchDocuments();
  }, [currentLease]);

  const handlePayNow = async (id: string) => {
    try {
      // Example: Simulate a payment API call
      const response = await Axios.post(
        "/tenants/payments/init/",
        {
          installmentId: id,
        },
        {
          headers: {
            Authorization: `Bearer ${session?.access}`, // Use token from session
          },
        }
      );

      setPaymentId(response.data.payment_id);
      setClientSecret(response.data.client_secret);
      toast("Success", {
        description: "Payment has been successfully processed.",
      });

      // Optionally, refresh the installments list or update the status
      fetchLease(); // Refresh the lease data to update installment statuses
      fetchInstallments(); // Refresh the installments list

      router.push(
        `/dashboard/payments?clientSecret=${clientSecret}&payment_id=${payment_id}`
      );
    } catch (err: any) {
      console.error(
        "Error processing payment:",
        err.response?.data || err.message
      );
      toast("Error", {
        description: "Failed to process payment. Please try again.",
      });
    }
  };

  const handleRenewalSubmit = () => {
    // Here you would handle the renewal request submission
    setRenewalDialogOpen(false);
  };

  const handleTerminationSubmit = () => {
    setTerminationDialogOpen(false);
  };

  const handleDocumentUpload = async () => {
    if (!selectedFile || !documentType || !currentLease) {
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
      formData.append("lease_id", currentLease.id.toString());

      const response = await Axios.post("/tenants/upload-document/", formData, {
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
      await Axios.delete(`/tenants/documents/delete/${documentId}/`, {
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
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Lease Management</h1>
          <p className="text-muted-foreground">
            View and manage your lease agreement
          </p>
        </div>
      </div>

      {!currentLease ? (
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle>No Active Lease Available</CardTitle>
            <CardDescription>
              You don't have any active lease agreements at the moment.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <Home className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-center mb-6">
              When you have an active lease agreement, you'll be able to manage
              it here.
            </p>
            <Button onClick={() => router.push("/dashboard/inquiries")}>
              Check your Inquires
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs
          defaultValue="overview"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Lease Overview</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Lease Details</span>
              <span className="sm:hidden">Details</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Documents</span>
              <span className="sm:hidden">Documents</span>
            </TabsTrigger>
            {/* <TabsTrigger value="requests" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Request History</span>
              <span className="sm:hidden">Requests</span>
            </TabsTrigger> */}
            {/* <TabsTrigger value="installments" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Installments</span>
              <span className="sm:hidden">Installments</span>
            </TabsTrigger> */}
          </TabsList>

          {/* Lease Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Current Lease</CardTitle>
                      <CardDescription className="mt-1">
                        Overview of your active lease agreement
                      </CardDescription>
                    </div>
                    <StatusBadge status={currentLease.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Property
                    </h3>
                    <p className="text-lg font-medium">
                      {currentLease.property.name},
                      {currentLease.property.address}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Lease Period
                      </h3>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formatDate(currentLease.startDate)} -{" "}
                          {formatDate(currentLease.end_date)}
                        </span>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Lease Progress</span>
                          <span>{Math.round(leaseProgress)}%</span>
                        </div>
                        <Progress value={leaseProgress} className="h-2" />
                        <p className="text-sm text-muted-foreground mt-2">
                          {daysRemaining} days remaining in your lease
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">
                        Financial Details
                      </h3>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Monthly Rent: £
                            {currentLease.monthly_rent ||
                              currentLease.installmentAmount}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Due Date:{" "}
                            {new Date(currentLease.end_date).getDate()}
                            st of each month
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Holding Fee: £
                            {currentLease.holding_fee ||
                              currentLease.property.security_deposit}{" "}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StopCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Utility Amount: £
                            {currentLease.property.utility_amount}{" "}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => setTerminationDialogOpen(true)}
                    >
                      <CalendarX className="mr-2 h-4 w-4" />
                      Request Termination
                    </Button>
                    {/* <Button variant="outline">
                      <Eye className="mr-2 h-4 w-4" />
                      View Full Agreement
                    </Button> */}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Important Dates</CardTitle>
                  <CardDescription>Key dates for your lease</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Lease Start</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(currentLease.startDate)}
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
                          {formatDate(currentLease.end_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <CalendarRange className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">Renewal Deadline</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(
                            new Date(
                              new Date(currentLease.end_date).setDate(
                                new Date(currentLease.end_date).getDate() - 60
                              )
                            ).toISOString()
                          )}
                        </p>
                      </div>
                    </div>
                  </div> */}

                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-medium mb-3">
                      Monthly Rent Due Dates
                    </h3>
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => {
                        const today =
                          new Date(currentLease.startDate) > new Date()
                            ? new Date(currentLease.startDate)
                            : new Date();

                        const nextMonth = new Date(
                          today.getFullYear(),
                          today.getMonth() + i,
                          new Date(
                            currentLease.end_date || new Date()
                          ).getDate()
                        );
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm">
                              {isNaN(nextMonth.getTime())
                                ? "Invalid Date"
                                : formatDate(nextMonth.toISOString())}
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200"
                            >
                              £
                              {currentLease.monthly_rent ||
                                currentLease.installmentAmount}
                            </Badge>
                          </div>
                        );
                      })}
                      <Button
                        variant="outline"
                        className="w-full mt-2 bg-green-400 hover:bg-green-100"
                        onClick={() =>
                          router.push(`/dashboard/payments/${currentLease.id}`)
                        }
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Pay Utilities
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full mt-2 bg-green-400 hover:bg-green-100"
                        onClick={() =>
                          router.push(
                            `/dashboard/rent-direct-debit/${currentLease.id}`
                          )
                        }
                      >
                        <Banknote className="mr-2 h-4 w-4" />
                        Add Rental Direct Debit details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* <Card>
              <CardHeader>
                <CardTitle>Recent Payment History</CardTitle>
                <CardDescription>Your recent rent payments</CardDescription>
              </CardHeader>
              <CardContent>
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
                      {currentLease.paymentHistory.slice(0, 5).map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.date)}</TableCell>
                          <TableCell>{payment.reference}</TableCell>
                          <TableCell>£{payment.amount}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${
                                payment.status === "Paid"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : payment.status === "Pending"
                                  ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }`}
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button variant="ghost" className="w-full mt-4">
                  View All Payments
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card> */}
          </TabsContent>

          {/* Lease Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Lease Agreement Details</CardTitle>
                  <CardDescription>
                    Complete information about your lease agreement
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Lease Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Lease ID
                        </p>
                        <p className="font-medium">{currentLease.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <StatusBadge status={currentLease.status} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Start Date
                        </p>
                        <p className="font-medium">
                          {formatDate(currentLease.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          End Date
                        </p>
                        <p className="font-medium">
                          {formatDate(currentLease.end_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Duration
                        </p>
                        <p className="font-medium">12 months</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Days Remaining
                        </p>
                        <p className="font-medium">{daysRemaining} days</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Property Information
                    </h3>
                    <div className="p-4 border rounded-lg">
                      <p className="font-medium">
                        {currentLease.property.address}
                      </p>
                      {/* <p className="text-sm text-muted-foreground mt-1">
                        {currentLease.propertyType}
                      </p> */}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Financial Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Monthly Rent
                        </p>
                        <p className="font-medium">
                          £
                          {currentLease.monthly_rent ||
                            currentLease.installmentAmount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Payment Due Date
                        </p>
                        <p className="font-medium">
                          {/* {currentLease.end_date} */}
                          {new Date(currentLease.end_date).getDate()}st of each
                          month
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Holding Fee
                        </p>
                        <p className="font-medium">
                          £
                          {currentLease.holding_fee ||
                            currentLease.property.security_deposit}
                        </p>
                      </div>
                      {/* <div>
                        <p className="text-sm text-muted-foreground">
                          Deposit Scheme
                        </p>
                        <p className="font-medium">
                          {currentLease.depositScheme} deposit scheme
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Deposit ID
                        </p>
                        <p className="font-medium">{currentLease.depositID}</p>{" "}
                        deposit id here
                      </div> */}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Tenants
                    </h3>
                    <div className="p-4 border rounded-lg">
                      {/* {currentLease.tenants.map((tenant, index) => ( */}
                      <div
                        // key={index}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <p className="font-medium">
                            {currentLease.tenant.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {currentLease.tenant.email}
                          </p>
                        </div>
                        <Badge variant="outline">Primary Tenant</Badge>
                      </div>
                      {/* ))} */}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Landlord Information
                    </h3>
                    <div className="p-4 border rounded-lg">
                      <p className="font-medium">
                        {currentLease.property.landlord.name}
                      </p>
                      <p className="text-sm">
                        Contact: {currentLease.property.landlord.name}
                      </p>
                      <div className="mt-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{currentLease.property.landlord.email}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{currentLease.property.landlord.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="special-terms">
                      <AccordionTrigger>
                        Special Terms and Conditions
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 pl-6 list-disc">
                          {/* {currentLease.specialTerms.map((term, index) => (
                            <li key={index}>{term}</li>
                          ))} */}
                          Special Terms here
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="renewal-terms">
                      <AccordionTrigger>Renewal Terms</AccordionTrigger>
                      <AccordionContent>
                        {/* <p>{currentLease.renewalTerms}</p> */} Renewal Terms
                        goes here
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="termination-terms">
                      <AccordionTrigger>Termination Terms</AccordionTrigger>
                      <AccordionContent>
                        {/* <p>{currentLease.terminationTerms}</p> */}{" "}
                        Termination terms goes here
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* <div className="flex justify-center pt-4">
                    <Button>
                      <FileText className="mr-2 h-4 w-4" />
                      View Full Lease Agreement
                    </Button>
                  </div> */}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Lease Actions</CardTitle>
                    <CardDescription>Manage your lease</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* <Button
                      className="w-full justify-start"
                      onClick={() => setRenewalDialogOpen(true)}
                    >
                      <CalendarCheck className="mr-2 h-4 w-4" />
                      Request Lease Renewal
                    </Button> */}
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setTerminationDialogOpen(true)}
                    >
                      <CalendarX className="mr-2 h-4 w-4" />
                      Request Lease Termination
                    </Button>
                    {/* <Button variant="outline" className="w-full justify-start">
                      <Download className="mr-2 h-4 w-4" />
                      Download Lease Agreement
                    </Button> */}
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="mr-2 h-4 w-4" />
                      Contact Landlord
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setActiveTab("documents")}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Documents
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full mt-2 bg-green-400 hover:bg-green-100"
                      onClick={() =>
                        router.push(`/dashboard/payments/${currentLease.id}`)
                      }
                    >
                      <DollarSign className="mr-2 h-4 w-4" />
                      Pay Utilities
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Need Help?</CardTitle>
                    <CardDescription>Resources and support</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <h3 className="font-medium">Tenant Rights Guide</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Learn about your rights as a tenant
                      </p>
                      <Button variant="link" className="px-0 mt-1">
                        View Guide
                      </Button>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h3 className="font-medium">Lease FAQ</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Common questions about your lease
                      </p>
                      <Button variant="link" className="px-0 mt-1">
                        View FAQ
                      </Button>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <h3 className="font-medium">Support Contact</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Need help with your lease?
                      </p>
                      <Button variant="link" className="px-0 mt-1">
                        Contact Support
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
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
                    onClick={() =>
                      window.open(
                        `/dashboard/forms/view/application?leaseId=${currentLease.id}`,
                        "_blank"
                      )
                    }
                  >
                    <FileText className="h-8 w-8 text-blue-600" />
                    <span className="font-medium">Application Form</span>
                    <span className="text-sm text-muted-foreground">
                      Tenant application details
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() =>
                      window.open(
                        `/dashboard/forms/view/guarantor?leaseId=${currentLease.id}`,
                        "_blank"
                      )
                    }
                  >
                    <Shield className="h-8 w-8 text-green-600" />
                    <span className="font-medium">Guarantor Form</span>
                    <span className="text-sm text-muted-foreground">
                      Guarantor details and signatures
                    </span>
                  </Button>

                 <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={() => window.open(`/dashboard/forms/view/agreement-1?leaseId=${currentLease.id}`, '_blank')}
                      >
                        <FileText className="h-8 w-8 text-purple-600" />
                        <span className="font-medium">Rental Agreement</span>
                        <span className="text-sm text-muted-foreground">Fixed term tenancy</span>
                      </Button>

                      <Button
                        variant="outline"
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={() => window.open(`/dashboard/forms/view/agreement?leaseId=${currentLease.id}`, '_blank')}
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
                    Upload lease-related documents for your landlord to review
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
                    Overview of your uploaded documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total Documents:
                      </span>
                      <span className="font-medium">{documents.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Last Upload:
                      </span>
                      <span className="font-medium">
                        {documents.length > 0
                          ? formatDate(documents[0].uploadedAt)
                          : "No documents uploaded"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Documents List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Documents</CardTitle>
                <CardDescription>
                  All documents you've uploaded for this lease
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
                          <TableHead>Document Type</TableHead>
                          <TableHead>Upload Date</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {doc.document_type_display
                                    ? doc.document_type_display
                                        .replace(/_/g, " ")
                                        .replace(/\b\w/g, (l: string) =>
                                          l.toUpperCase()
                                        )
                                    : "Unknown Document Type"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {doc.notes || "No notes"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleDocumentDownload(
                                      doc.id,
                                      doc.file.split("/").pop() || "document"
                                    )
                                  }
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    window.open(doc.file, "_blank")
                                  }
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDocumentDelete(doc.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
          </TabsContent>

          {/* Installments tab content */}
          <TabsContent value="installments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Installment Schedule</CardTitle>
                <CardDescription>
                  View your upcoming and past installment payments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installments.map((installment, index) => {
                        // const isPayNowVisible = installment.status === "pending"; // Show "Pay Now" for the latest two pending installments
                        return (
                          <TableRow key={index}>
                            <TableCell>{installment.dueDate}</TableCell>
                            <TableCell>£{installment.amount}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`${
                                  installment.status === "paid"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : installment.status === "pending"
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                {installment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePayNow(installment.id)}
                              >
                                Pay Now
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Only render dialogs if currentLease exists */}
      {currentLease && (
        <>
          <Dialog open={renewalDialogOpen} onOpenChange={setRenewalDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Request Lease Renewal</DialogTitle>
                <DialogDescription>
                  Submit a request to renew your lease. Your landlord will
                  review your request and respond.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="renewal-period">Renewal Period</Label>
                  <RadioGroup
                    value={renewalPeriod}
                    onValueChange={setRenewalPeriod}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="6" id="r1" />
                      <Label htmlFor="r1">6 months</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="12" id="r2" />
                      <Label htmlFor="r2">12 months (recommended)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="24" id="r3" />
                      <Label htmlFor="r3">24 months</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="renewal-notes">
                    Additional Notes (Optional)
                  </Label>
                  <Textarea
                    id="renewal-notes"
                    placeholder="Any special requests or questions about your renewal..."
                    rows={4}
                    value={renewalNotes}
                    onChange={(e) => setRenewalNotes(e.target.value)}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>
                    Note: Your landlord may propose new terms or a rent
                    adjustment as part of the renewal process.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setRenewalDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleRenewalSubmit}>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={terminationDialogOpen}
            onOpenChange={setTerminationDialogOpen}
          >
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Request Lease Termination</DialogTitle>
                <DialogDescription>
                  Submit a request to terminate your lease. Please provide your
                  intended move-out date and reason.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="termination-date">
                    Intended Move-Out Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        id="termination-date"
                      >
                        {terminationDate ? (
                          // format(terminationDate, "PPP")
                          "Commented here"
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarRange className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={terminationDate}
                        onSelect={setTerminationDate}
                        disabled={(date) =>
                          date < new Date() ||
                          date <
                            new Date(
                              new Date().setDate(new Date().getDate() + 60)
                            )
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Note: Your move-out date must be at least 60 days from today
                    as per your lease agreement.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="termination-reason">
                    Reason for Termination
                  </Label>
                  <Select
                    value={terminationReason}
                    onValueChange={setTerminationReason}
                  >
                    <SelectTrigger id="termination-reason">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moving">
                        Moving to a new city/location
                      </SelectItem>
                      <SelectItem value="buying">
                        Purchasing a property
                      </SelectItem>
                      <SelectItem value="size">
                        Need larger/smaller accommodation
                      </SelectItem>
                      <SelectItem value="financial">
                        Financial reasons
                      </SelectItem>
                      <SelectItem value="other">
                        Other (please specify)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="termination-notes">Additional Details</Label>
                  <Textarea
                    id="termination-notes"
                    placeholder="Please provide any additional information about your termination request..."
                    rows={4}
                    value={terminationNotes}
                    onChange={(e) => setTerminationNotes(e.target.value)}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>
                    Important: Early termination may result in penalties as
                    outlined in your lease agreement. Please review the
                    termination terms before proceeding.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setTerminationDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleTerminationSubmit}>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={uploadDocumentDialogOpen}
            onOpenChange={setUploadDocumentDialogOpen}
          >
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Upload lease-related documents for your landlord to review.
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
                      <SelectItem value="proof_of_income">
                        Proof of Income
                      </SelectItem>
                      <SelectItem value="bank_statement">
                        Bank Statement
                      </SelectItem>
                      <SelectItem value="employment_letter">
                        Employment Letter
                      </SelectItem>
                      <SelectItem value="reference_letter">
                        Reference Letter
                      </SelectItem>
                      <SelectItem value="identification">
                        Identification
                      </SelectItem>
                      <SelectItem value="utility_bill">Utility Bill</SelectItem>
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
        </>
      )}
    </div>
  );
}

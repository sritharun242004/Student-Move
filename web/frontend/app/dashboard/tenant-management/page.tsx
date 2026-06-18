"use client";

import { useState, useEffect } from "react";
import {
  User,
  Users,
  Home,
  Calendar,
  Search,
  Plus,
  Mail,
  Phone,
  FileText,
  Clock,
  Trash2,
  CalendarDays,
  Download,
  Eye,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Axios from "@/config/axios.config";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { LandlordGuard } from "@/components/dashboard/landlord-guard";
import { useAgentAxios } from "@/hooks/useAgentAxios";

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "open":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          Open
        </Badge>
      );
    case "acknowledged":
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200"
        >
          Acknowledged
        </Badge>
      );
    case "scheduled":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          scheduled
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Completed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

interface Lease {
  id: number;
  installmentType: string;
  leaseMonths: number;
  startDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  tenant: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  propertyObj: number;
  property: {
    id: number;
    name: string;
    address: string;
    landlord: {
      id: number;
      name: string;
      phone: string;
      email: string;
    };
    security_deposit: number;
    holding_deposit: number;
  };
  end_date: string;
  installmentAmount: number;
  monthly_rent?: number;
  holding_fee?: number;
}

export default function TenantManagement() {
  const { data: session } = useSession();
  const axios = useAgentAxios();
  const [activeTab, setActiveTab] = useState("tenants");
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [addInspectionDialog, setAddInspectionDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [tenants, setTenants] = useState([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  interface Inspection {
    id: number;
    date: string;
    type: string;
    status: string;
    tenant: string;
    lease: Lease;
    unit: string;
  }

  interface Payment {
    id: string;
    dueDate: string;
    amount: number;
    status: string;
    type: string;
    paidDate?: string;
    createdAt?: string;
    updatedAt?: string;
    lease: number;
    payment: {
      id: string;
      receipt_file_url?: string;
    };
  }

  const [inspections, setInspections] = useState<Inspection[]>([]);

  const [inspectionType, setInspectionType] = useState("");
  const [inspectionTime, setInspectionTime] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Document management state
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] =
    useState(false);
  const [documentType, setDocumentType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentNotes, setDocumentNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [upcomingPayments, setUpcomingPayments] = useState<Payment[]>([]);

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format date with time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter tenants based on search query
  const filteredLeases = leases.filter(
    (lease) =>
      lease.tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lease.tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lease.property.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchTenants = async () => {
    try {
      if (!session || !session.access) {
        throw new Error("No session or token found!");
      }
      const response = await axios.get("/users/tenant/");
      setTenants(response.data.users);
      setLoading(false);
    } catch (err) {
      // setError(err.message);
      setLoading(false);
    }
  };

  // const fetchProperties = async () => {
  //   try {
  //     const response = await Axios.get("/properties/", {
  //       headers: {
  //         Authorization: `Bearer ${session?.access}`, // Use token from session
  //       },
  //     });
  //     setProperties(
  //       Array.isArray(response.data.data) ? response.data.data : []
  //     );
  //     console.log("response prop: ", response.data.data);
  //     setLoading(false);
  //   } catch (err) {
  //     // setError(err.message);
  //     setLoading(false);
  //   }
  // };

  const fetchLeases = async () => {
    try {
      const response = await axios.get("/tenants/requests");
      setLeases(Array.isArray(response.data.data) ? response.data.data : []);
      setLoading(false);
    } catch (err) {
      // setError(err.message);
      setLoading(false);
    }
  };

  const fetchInspections = async () => {
    try {
      const response = await axios.get("/tenants/inspections/");
      setInspections(
        Array.isArray(response.data.data) ? response.data.data : []
      );
      setLoading(false);
    } catch (err) {
      // setError(err.message);
      setLoading(false);
    }
  };

  // Document management functions
  const fetchDocuments = async () => {
    if (!selectedTenant) return;

    setIsLoadingDocuments(true);
    try {
      const response = await axios.get(
        `/tenants/documents/${selectedTenant.id}/`
      );
      setDocuments(response.data);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const fetchUtilities = async () => {
    try {
      //ge by lease id: update later
      const response = await Axios.get(
        `/tenants/utilities-list/${selectedTenant.id}/`,
        {
          headers: {
            Authorization: `Bearer ${session?.access}`, // Use token from session
          },
        }
      );
      // const installments = response.data.data;
      setUpcomingPayments(response.data.data);
    } catch (err) {
      console.error("Error fetching lease data:", err);
    }
  };

  const handleDocumentDownload = async (
    documentId: string,
    filename: string
  ) => {
    try {
      const response = await axios.get(
        `/tenants/documents/download/${documentId}/`,
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading document:", err);
      toast("Error", {
        description: "Failed to download document",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast("Error", {
          description: "File size must be less than 10MB",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDocumentUpload = async () => {
    if (!selectedFile || !documentType || !selectedTenant) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("document_type", documentType);
      formData.append("lease_id", selectedTenant.id.toString());
      if (documentNotes) {
        formData.append("notes", documentNotes);
      }

      await axios.post("/tenants/upload-document/", formData, {
        headers: {
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
    } catch (err) {
      console.error("Error uploading document:", err);
      toast("Error", {
        description: "Failed to upload document. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocumentDelete = async (documentId: string) => {
    try {
      await axios.delete(`/tenants/documents/delete/${documentId}/`);

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

  // Fetch documents when selectedTenant changes
  useEffect(() => {
    if (selectedTenant) {
      fetchDocuments();
      fetchUtilities();
    }
  }, [selectedTenant]);

  useEffect(() => {
    fetchInspections();
    fetchLeases();
    fetchTenants();
  }, [session]);

  if (loading) return <p>Loading...</p>;
  // if (error) return <p>Error: {error}</p>;

  const handleScheduleInspection = async () => {
    if (!session?.access) {
      console.error("No session or token found!");
      return;
    }

    try {
      const payload = {
        lease: selectedTenant?.id, // Property ID
        inspectionDate: selectedDate?.toISOString().split("T")[0], // Date in YYYY-MM-DD format
        notes: inspectionNotes, // Additional notes
        status: "scheduled",
        type: inspectionType, // Inspection type (e.g., "routine", "move-in")
        date: selectedDate?.toISOString().split("T")[0], // Full date-time string
        time: inspectionTime, // Time in HH:mm format
      };

      const response = await axios.post("/tenants/inspections/", payload);

      toast("Success", {
        description: "Inspection has been successfully scheduled.",
      });

      // Reset the form and close the dialog
      setAddInspectionDialog(false);
      setInspectionType("");
      setSelectedDate(undefined);
      setInspectionTime("");
      setInspectionNotes("");
    } catch (err: any) {
      console.error(
        "Error scheduling inspection:",
        err.response?.data || err.message
      );
      toast("Error", {
        description: "Failed to schedule inspection. Please try again.",
      });
    }
  };

  const handleMarkInspection = async (status: string, inspectionId: number) => {
    if (!session?.access) {
      console.error("No session or token found!");
      return;
    }

    try {
      const response = await axios.patch(
        `/tenants/inspections/${inspectionId}/update-status/`,
        { status: status }
      );

      toast("Success", {
        description: "Inspection status updated to completed.",
      });

      // Refresh inspections list
      fetchInspections();
    } catch (err: any) {
      console.error(
        "Error updating inspection status:",
        err.response?.data || err.message
      );
      toast("Error", {
        description: "Failed to update inspection status. Please try again.",
      });
    }
  };

  // --- NEW FUNCTION ---
  const handleMarkPaymentAsPaid = async (paymentId: string) => {
    try {
      // !!! IMPORTANT: Update this URL to your correct API endpoint !!!
      const response = await axios.put(
        `/tenants/payments/manual/verify/${paymentId}/`, // <-- Placeholder URL
        {
          status: "paid",
        }
      );

      toast("Success", {
        description: "Payment marked as paid successfully!",
      });

      // Refresh the utilities/payments list to show the change
      fetchUtilities();
    } catch (err) {
      console.error("Error marking payment as paid:", err);
      toast("Error", {
        description: "Failed to mark payment as paid. Please try again.",
      });
    }
  };
  // --- END NEW FUNCTION ---

  return (
    <LandlordGuard>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Tenant Management</h1>
          <div className="flex gap-2">
            {/* <Button onClick={() => setAddTenantDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tenant
            </Button> */}
          </div>
        </div>

        <Tabs
          defaultValue="tenants"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tenants" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Tenants</span>
              <span className="sm:hidden">Tenants</span>
            </TabsTrigger>
            <TabsTrigger value="details" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Tenant Details</span>
              <span className="sm:hidden">Details</span>
            </TabsTrigger>
            <TabsTrigger
              value="inspections"
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Inspections</span>
              <span className="sm:hidden">Inspect</span>
            </TabsTrigger>
          </TabsList>

          {/* Tenants Tab */}
          <TabsContent value="tenants" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Tenants</CardTitle>
                <CardDescription>
                  View and manage all tenants across your properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search tenants by name, email, or property..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.name}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Lease Period</TableHead>
                        <TableHead>Rent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeases.map((lease) => (
                        <TableRow key={lease.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                {/* <AvatarImage
                                src={lease.tenant.name}
                                alt={lease.tenant.name}
                              /> */}
                                <AvatarFallback>
                                  {lease.tenant?.email.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {lease.tenant?.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {lease.tenant?.email}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {lease.tenant?.phone
                                    ? `No: ${lease.tenant?.phone}`
                                    : ""}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{lease.property?.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {/* {tenant.unit} */}
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(lease.startDate)} -{" "}
                            {formatDate(lease.end_date)}
                          </TableCell>
                          <TableCell>
                            £{lease.monthly_rent || lease.installmentAmount}
                            /month
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                lease?.status === "active"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {lease?.status === "active"
                                ? "Active"
                                : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={"ghost"}
                              onClick={() => {
                                setSelectedTenant(lease);
                                setActiveTab("details");
                              }}
                            >
                              View details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tenant Details Tab */}
          <TabsContent value="details" className="space-y-4">
            {selectedTenant ? (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle>Tenant Information</CardTitle>
                          <CardDescription>
                            Personal and contact details
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-6">
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={selectedTenant.avatar}
                            alt={selectedTenant.tenant.name}
                          />
                          <AvatarFallback>
                            {selectedTenant.tenant.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="text-xl font-bold">
                            {selectedTenant.tenant.name}
                          </h2>
                          <Badge
                            variant={
                              selectedTenant.status === "active"
                                ? "secondary"
                                : "destructive"
                            }
                            className="mt-1"
                          >
                            {selectedTenant.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              Email Address
                            </h3>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span>{selectedTenant.tenant.email}</span>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              Phone Number
                            </h3>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {selectedTenant.tenant.phone || "Not provided"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              Property
                            </h3>
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 text-muted-foreground" />
                              <span>{selectedTenant.property.name}</span>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              Lease Period
                            </h3>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {formatDate(selectedTenant.startDate)} -{" "}
                                {formatDate(selectedTenant.end_date)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Lease Details</CardTitle>
                      <CardDescription>
                        Lease agreement and payment information
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              Rent Amount
                            </h3>
                            <p className="text-xl font-bold">
                              £
                              {selectedTenant.monthly_rent ||
                                selectedTenant.installmentAmount}{" "}
                              <span className="text-sm font-normal text-muted-foreground">
                                per month
                              </span>
                            </p>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              Payment Due Date
                            </h3>
                            <p>1st of each month</p>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              Holding Fee
                            </h3>
                            <p>
                              £
                              {selectedTenant.holding_fee ||
                                selectedTenant.property.security_deposit}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              Lease Start Date
                            </h3>
                            <p>{formatDate(selectedTenant.startDate)}</p>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              Lease End Date
                            </h3>
                            <p>{formatDate(selectedTenant.end_date)}</p>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">
                              Lease Term
                            </h3>
                            <p>{selectedTenant.leaseMonths} Months</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    {/* <CardFooter className="border-t px-6 py-4">
                    <Button variant="outline" className="w-full">
                      <FileText className="mr-2 h-4 w-4" />
                      View Full Lease Agreement
                    </Button>
                  </CardFooter> */}
                  </Card>

                </div>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Documents</CardTitle>
                      <CardDescription>
                        Tenant-related documents
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingDocuments ? (
                        <div className="flex items-center justify-center py-8">
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Loading documents...
                        </div>
                      ) : documents.length > 0 ? (
                        <div className="space-y-3">
                          {documents.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {doc.document_type_display
                                      ? doc.document_type_display
                                          .replace(/_/g, " ")
                                          .replace(/\b\w/g, (l: string) =>
                                            l.toUpperCase()
                                          )
                                      : "Unknown Document Type"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(doc.uploadedAt)}
                                  </p>
                                  {doc.notes && (
                                    <p className="text-xs text-muted-foreground">
                                      {doc.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
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
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground mt-2">
                            No documents uploaded yet
                          </p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setUploadDocumentDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Upload Document
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card>
                    <CardHeader>
                      {/* <CardTitle>Upcoming Inspections</CardTitle> */}
                      {/* <CardDescription>
                        Scheduled property inspections
                      </CardDescription> */}
                    </CardHeader>
                    <CardContent>
                      {inspections
                        .filter(
                          (inspection) =>
                            inspection.tenant === selectedTenant.name &&
                            inspection.status === "Scheduled" &&
                            new Date(inspection?.date) > new Date()
                        )
                        .map((inspection) => (
                          <div
                            key={inspection.id}
                            className="flex items-center justify-between p-3 border rounded-lg mb-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {inspection.type} Inspection
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDateTime(inspection.date)}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline">Scheduled</Badge>
                          </div>
                        ))}

                      {inspections.filter(
                        (inspection) =>
                          inspection.tenant === selectedTenant.firstName &&
                          inspection.status === "Scheduled" &&
                          new Date(inspection.date) > new Date()
                      ).length === 0 && (
                        <div className="text-center py-6">
                          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Calendar className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <h3 className="text-lg font-medium mb-1">
                            No upcoming inspections
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            There are no scheduled inspections for this tenant.
                          </p>
                        </div>
                      )}
                      <div className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAddInspectionDialog(true);
                          }}
                        >
                          Schedule Inspection
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
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    No tenant selected
                  </h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    Select a tenant from the tenants list to view their details,
                    or add a new tenant to get started.
                  </p>
                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("tenants")}
                    >
                      View Tenants
                    </Button>
                    {/* <Button onClick={() => setAddTenantDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tenant
                  </Button> */}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Inspections Tab */}
          <TabsContent value="inspections" className="space-y-4 w-full">
            {/* <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6"> */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Property Inspections</CardTitle>
                    <CardDescription>
                      Schedule and manage property inspections
                    </CardDescription>
                  </div>
                  {/* <Button onClick={() => setAddInspectionDialog(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Schedule Inspection
                    </Button> */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search inspections..."
                      className="pl-8"
                    />
                  </div>
                  <Select>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div>{selectedTenant.name}</div>
                            {/* <div className="text-sm text-muted-foreground">
                              {inspection.unit}
                            </div> */}
                          </TableCell>
                          {/* <TableCell>
                            {inspection?.lease?.tenant?.name}
                          </TableCell>
                          <TableCell>
                            {formatDateTime(inspection.date)}
                          </TableCell>
                          <TableCell>{inspection.type}</TableCell>
                          <TableCell>
                            <StatusBadge status={inspection.status} />
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
                                  onClick={() =>
                                    handleMarkInspection(
                                      "completed",
                                      inspection.id
                                    )
                                  }
                                >
                                  Mark as completed
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    handleMarkInspection(
                                      "canceled",
                                      inspection.id
                                    )
                                  }
                                >
                                  Cancel inspection
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell> */}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Inspection Dialog */}
        <Dialog
          open={addInspectionDialog}
          onOpenChange={setAddInspectionDialog}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Schedule Property Inspection</DialogTitle>
              <DialogDescription>
                Schedule a new property inspection
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor="inspection-property">
                  Property
                </Label>
                <Select disabled>
                  <SelectTrigger
                    id="inspection-property"
                    className="col-span-3"
                  >
                    <SelectValue placeholder={selectedTenant?.property?.name} />
                  </SelectTrigger>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor="inspection-tenant">
                  Tenant
                </Label>
                <Select disabled>
                  <SelectTrigger id="inspection-tenant" className="col-span-3">
                    <SelectValue placeholder={selectedTenant?.tenant?.name} />
                  </SelectTrigger>
                  <SelectContent>
                    {leases.map((lease) => (
                      <SelectItem
                        key={lease.tenant.id}
                        value={lease.tenant.id.toString()}
                      >
                        {lease.tenant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor="inspection-type">
                  Type
                </Label>
                <Select onValueChange={(value) => setInspectionType(value)}>
                  <SelectTrigger id="inspection-type" className="col-span-3">
                    <SelectValue placeholder="Select inspection type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">Routine</SelectItem>
                    <SelectItem value="move-in">Move-in</SelectItem>
                    <SelectItem value="move-out">Move-out</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor="inspection-date">
                  Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="col-span-3 justify-start text-left font-normal"
                    >
                      {selectedDate ? (
                        formatDate(selectedDate.toISOString())
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor="inspection-time">
                  Time
                </Label>
                <Input
                  id="inspection-time"
                  type="time"
                  className="col-span-3"
                  value={inspectionTime}
                  onChange={(e) => setInspectionTime(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right" htmlFor="inspection-notes">
                  Notes
                </Label>
                <Textarea
                  id="inspection-notes"
                  placeholder="Additional notes about the inspection"
                  className="col-span-3"
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddInspectionDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleScheduleInspection();
                  setAddInspectionDialog(false);
                }}
              >
                Schedule Inspection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Document Upload Dialog */}
        <Dialog
          open={uploadDocumentDialogOpen}
          onOpenChange={setUploadDocumentDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload documents for the selected tenant's lease.
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
                  Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG. Maximum file
                  size: 10MB.
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
      </div>
    </LandlordGuard>
  );
}

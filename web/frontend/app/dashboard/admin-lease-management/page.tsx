"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  MoreHorizontal,
  Shield,
  FileCheck,
  User,
  DollarSign,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import Axios from "@/config/axios.config";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lease, LeaseStatus } from "@/types/leaseType";

// Format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Invalid Date"; // Handle invalid date
  }
  return format(date, "PPP"); // e.g., "April 29, 2023"
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

export default function AdminLeaseManagement() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [activeTab, setActiveTab] = useState("all-leases");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [landlordFilter, setLandlordFilter] = useState("all");
  const [tenantFilter, setTenantFilter] = useState("all");

  // Filter leases based on search query, status filter, and property filter
  const filteredLeases = leases.filter((lease) => {
    const matchesSearch =
      lease.id.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      lease.property.address
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      lease.tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lease.property.landlord?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      lease.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesProperty = true; // Removed property filter as it's not used

    const matchesLandlord =
      landlordFilter === "all" ||
      lease.property.landlord?.id?.toString().toLowerCase() ===
        landlordFilter.toLowerCase();

    const matchesTenant =
      tenantFilter === "all" ||
      lease.tenant.id.toString().toLowerCase() ===
        tenantFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesProperty && matchesLandlord && matchesTenant;
  });

  // Calculate lease statistics
  const totalLeases = leases.length;
  const activeLeases = leases.filter((lease) => lease.status === "active").length;
  const pendingLeases = leases.filter((lease) => lease.status === "pending").length;
  const completedLeases = leases.filter((lease) => lease.status === "completed").length;

  // Get unique landlords and tenants for filters
  const uniqueLandlords = Array.from(
    new Set(leases.map((lease) => lease.property.landlord?.id).filter(Boolean))
  ).map((id) => {
    const lease = leases.find((l) => l.property.landlord?.id === id);
    return lease?.property.landlord;
  }).filter(Boolean);

  const uniqueTenants = Array.from(
    new Set(leases.map((lease) => lease.tenant.id))
  ).map((id) => {
    const lease = leases.find((l) => l.tenant.id === id);
    return lease?.tenant;
  });

  const fetchLeases = async () => {
    try {
      const response = await Axios.get("/tenants/requests/", {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
      });
      let leasesData = response.data.data;
      // Handle pagination case
      if (!Array.isArray(leasesData) && leasesData.results) {
        leasesData = leasesData.results;
      }
      setLeases(Array.isArray(leasesData) ? leasesData : []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching leases:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && session.role === "admin") {
      fetchLeases();
    }
  }, [session]);

  const handleViewForm = (lease: any, formType: string) => {
    router.push(`/dashboard/forms/view/${formType}?leaseId=${lease.id}`);
  };

  const handleViewPayments = (lease: any) => {
    router.push(`/dashboard/admin-payments/${lease.id}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading leases...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Lease Management</h1>
          <p className="text-muted-foreground">
            View and manage all leases across the platform
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leases</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeases}</div>
            <div className="text-xs text-muted-foreground">
              All leases in the system
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Leases</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeases}</div>
            <div className="text-xs text-muted-foreground">
              Currently active leases
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leases</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLeases}</div>
            <div className="text-xs text-muted-foreground">
              Awaiting approval
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Leases</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedLeases}</div>
            <div className="text-xs text-muted-foreground">
              Finished leases
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all-leases" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="all-leases" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>All Leases</span>
          </TabsTrigger>
        </TabsList>

        {/* All Leases Tab */}
        <TabsContent value="all-leases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Leases</CardTitle>
              <CardDescription>
                Complete list of all leases in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by lease ID, property, tenant, or landlord..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="tenant_closed">Tenant Closed</SelectItem>
                      <SelectItem value="landlord_closed">Landlord Closed</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={landlordFilter} onValueChange={setLandlordFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Landlord" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Landlords</SelectItem>
                      {uniqueLandlords.map((landlord) => (
                        <SelectItem key={landlord!.id} value={landlord!.id.toString()}>
                          {landlord!.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={tenantFilter} onValueChange={setTenantFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Tenant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tenants</SelectItem>
                      {uniqueTenants.map((tenant) => (
                        <SelectItem key={tenant!.id} value={tenant!.id.toString()}>
                          {tenant!.name}
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
                      <TableHead>Landlord</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Rent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeases.map((lease) => (
                      <TableRow key={lease.id}>
                        <TableCell className="font-medium">{lease.id}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={lease.property.address}>
                            {lease.property.address.split(",")[0]}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {lease.property.landlord?.name || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage alt={lease.tenant.name} />
                              <AvatarFallback className="text-xs">
                                {lease.tenant.name.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{lease.tenant.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(lease.startDate)}</div>
                            <div className="text-muted-foreground">to</div>
                            <div>{formatDate(lease.end_date)}</div>
                          </div>
                        </TableCell>
                        <TableCell>£{(lease.monthly_rent || lease.installmentAmount)}/month</TableCell>
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
                              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">View Forms</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewForm(lease, "application")}>
                                <FileText className="mr-2 h-4 w-4" />
                                Application Form
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewForm(lease, "guarantor")}>
                                <Shield className="mr-2 h-4 w-4" />
                                Guarantor Form
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewForm(lease, "agreement-1")}>
                                <FileCheck className="mr-2 h-4 w-4" />
                                Rental Agreement Form
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewForm(lease, "agreement")}>
                                <FileCheck className="mr-2 h-4 w-4" />
                                Utility Agreement Form
                              </DropdownMenuItem>
                              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground pt-2">Payment</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewPayments(lease)}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                View Payments
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredLeases.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No leases found matching your criteria
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredLeases.length} of {leases.length} leases
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
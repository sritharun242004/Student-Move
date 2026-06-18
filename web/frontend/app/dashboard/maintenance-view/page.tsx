"use client";

import { useState, useEffect } from "react";
import {
  AlertCircle,
  MoreHorizontal,
  Search,
  PenToolIcon as Tool,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { LandlordGuard } from "@/components/dashboard/landlord-guard";
import { useAgentAxios } from "@/hooks/useAgentAxios";

// Mock data for service providers
const serviceProviders = [
  {
    id: 1,
    name: "Leeds Plumbing Services",
    specialty: "Plumbing",
    rating: 4.8,
  },
  { id: 2, name: "ElectriFix Ltd", specialty: "Electrical", rating: 4.7 },
  {
    id: 3,
    name: "City Glass Repairs",
    specialty: "Windows & Glass",
    rating: 4.5,
  },
  {
    id: 4,
    name: "CleanPro Services",
    specialty: "Cleaning & Mold",
    rating: 4.6,
  },
  {
    id: 5,
    name: "AllFix Maintenance",
    specialty: "General Repairs",
    rating: 4.9,
  },
];

// Mock data for properties
const properties = [
  { id: 1, address: "St. Chads Drive, Headingley", units: 3 },
  { id: 2, address: "Queens Road, Hyde Park", units: 2 },
  { id: 3, address: "Belle Vue Road, Hyde Park", units: 9 },
];

// Status badge component
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
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          Pending
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

// Priority badge component
const PriorityBadge = ({ priority }: { priority: string }) => {
  switch (priority) {
    case "high":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          High
        </Badge>
      );
    case "normal":
      return (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-600 border-orange-200"
        >
          Medium
        </Badge>
      );
    case "low":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Low
        </Badge>
      );
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
};

export default function MaintenanceManagement() {
  const { data: session } = useSession();
  const axios = useAgentAxios();
  const [activeTab, setActiveTab] = useState("requests");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  interface MaintenanceRequest {
    id: number;
    property: { name: string };
    issueTitle: string;
    priority: string;
    status: string;
    createdAt: string;
    assignedTo?: string;
    completedDate?: string;
  }

  const [maintenanceRequests, setMaintenanceRequests] = useState<
    MaintenanceRequest[]
  >([]);

  // Format date to readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter requests by property
  const filteredRequests = selectedProperty
    ? maintenanceRequests.filter(
        (req) => req.property.name === selectedProperty
      )
    : maintenanceRequests;

  // Get maintenance history for a specific property
  const getPropertyHistory = (propertyAddress: string) => {
    return maintenanceRequests
      .filter((req) => req.property.name === propertyAddress)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  };

  const fetchMaintenanceRequests = async () => {
    try {
      const response = await axios.get("/tenants/maintanance-requests/");
      setMaintenanceRequests(response.data.data);
      // setLoading(false);
    } catch (err) {
      // toast("Error", {
      //   description: "Failed to load maintenance request. Please try again.",
      // });
      // setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceRequests();
  }, [session]);

  const handleMarkAsComplete = async (requestId: number) => {
    try {
      if (!session?.access) {
        console.error("No session or token found!");
        return;
      }

      const response = await axios.patch(
        `/tenants/maintanance-requests/${requestId}/update-status/completed/`,
        {} // Empty body for the PATCH request
      );

      toast("Success", {
        description: "Maintenance Request has been marked as completed",
      });
      fetchMaintenanceRequests();

      // window.location.reload();
    } catch (err) {
      toast("Error", {
        description: "Failed to update status. Please try again.",
      });
    }
  };

  return (
    <LandlordGuard>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Maintenance Management</h1>
          {/* <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button> */}
        </div>

        <Tabs
          defaultValue="requests"
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Maintenance Requests</span>
              <span className="sm:hidden">Requests</span>
            </TabsTrigger>
            {/* <TabsTrigger value="assign" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">Assign Tasks</span>
            <span className="sm:hidden">Assign</span>
          </TabsTrigger> */}
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Maintenance History</span>
              <span className="sm:hidden">History</span>
            </TabsTrigger>
          </TabsList>

          {/* Maintenance Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Maintenance Requests</CardTitle>
                <CardDescription>
                  View and manage all maintenance requests from tenants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search requests..."
                      className="pl-8"
                    />
                  </div>
                  <Select>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_statuses">All Statuses</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.id}
                          </TableCell>
                          <TableCell>{request.property.name}</TableCell>
                          <TableCell>{request.issueTitle}</TableCell>
                          <TableCell>
                            <PriorityBadge priority={request.priority} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={request.status} />
                          </TableCell>
                          <TableCell>{formatDate(request.createdAt)}</TableCell>
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
                                  onClick={() => setSelectedRequest(request)}
                                >
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {/* <DropdownMenuItem
                                disabled
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setAssignDialogOpen(true);
                                }}
                              >
                                Assign task
                              </DropdownMenuItem> */}
                                {request.status !== "completed" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleMarkAsComplete(request.id)
                                    }
                                  >
                                    Mark as completed
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Request Details Dialog */}
            {selectedRequest && (
              <Dialog
                open={!!selectedRequest && !assignDialogOpen}
                onOpenChange={(open) => !open && setSelectedRequest(null)}
              >
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Maintenance Request Details</DialogTitle>
                    <DialogDescription>
                      Request ID: {selectedRequest.id}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Property</Label>
                      <div className="col-span-3">
                        {selectedRequest.property.name}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Tenant</Label>
                      <div className="col-span-3">
                        {selectedRequest.lease.tenant.name}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Issue</Label>
                      <div className="col-span-3">
                        {selectedRequest.issueTitle}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Priority</Label>
                      <div className="col-span-3">
                        <PriorityBadge priority={selectedRequest.priority} />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Status</Label>
                      <div className="col-span-3">
                        <StatusBadge status={selectedRequest.status} />
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Date Submitted</Label>
                      <div className="col-span-3">
                        {formatDate(selectedRequest.createdAt)}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Assigned To</Label>
                      <div className="col-span-3">
                        {selectedRequest.assignedTo || "Not assigned"}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedRequest(null)}
                    >
                      Close
                    </Button>
                    {/* <Button
                    disabled
                    onClick={() => {
                      setAssignDialogOpen(true);
                    }}
                  >
                    Assign Task
                  </Button> */}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* Maintenance History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance History</CardTitle>
                <CardDescription>
                  View maintenance history for all properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Select onValueChange={setSelectedProperty}>
                    <SelectTrigger className="w-full sm:w-[300px]">
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_properties">
                        All Properties
                      </SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.address}>
                          {property.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search maintenance history..."
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">ID</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date Submitted</TableHead>
                        <TableHead>Completed Date</TableHead>
                        <TableHead>Service Provider</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceRequests
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                        )
                        .map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              {request.id}
                            </TableCell>
                            <TableCell>{request.property.name}</TableCell>
                            <TableCell>{request.issueTitle}</TableCell>
                            <TableCell>
                              <StatusBadge status={request.status} />
                            </TableCell>
                            <TableCell>
                              {formatDate(request.createdAt)}
                            </TableCell>
                            <TableCell>
                              {request.completedDate
                                ? formatDate(request.completedDate)
                                : "-"}
                            </TableCell>
                            <TableCell>{request.assignedTo || "-"}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {selectedProperty && (
              <Card>
                <CardHeader>
                  <CardTitle>Property Maintenance Summary</CardTitle>
                  <CardDescription>
                    Maintenance history for {selectedProperty}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex flex-col p-4 border rounded-lg">
                      <span className="text-sm text-muted-foreground">
                        Total Requests
                      </span>
                      <span className="text-3xl font-bold">
                        {getPropertyHistory(selectedProperty).length}
                      </span>
                    </div>
                    <div className="flex flex-col p-4 border rounded-lg">
                      <span className="text-sm text-muted-foreground">
                        Open Requests
                      </span>
                      <span className="text-3xl font-bold">
                        {
                          getPropertyHistory(selectedProperty).filter(
                            (r) => r.status === "Open"
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex flex-col p-4 border rounded-lg">
                      <span className="text-sm text-muted-foreground">
                        Avg. Completion Time
                      </span>
                      <span className="text-3xl font-bold">3.2 days</span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">
                      Recent Maintenance
                    </h3>
                    <div className="space-y-4">
                      {getPropertyHistory(selectedProperty)
                        .slice(0, 3)
                        .map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <Tool className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <h4 className="font-medium">
                                  {request.issueTitle}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(request.createdAt)}
                                </p>
                              </div>
                            </div>
                            <StatusBadge status={request.status} />
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </LandlordGuard>
  );
}

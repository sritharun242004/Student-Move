"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Clock,
  Plus,
  Search,
  Camera,
  X,
  MessageSquare,
  History,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useSession } from "next-auth/react";
import Axios from "@/config/axios.config";
import { toast } from "sonner";
import { useIdStore } from "@/app/store/useLeaseId";
import { Maintainance } from "@/types/leaseType";

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
    case "acknowledged":
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200"
        >
          Acknowledged
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

export default function TenantMaintenance() {
  const { data: session } = useSession();
  const leaseId = useIdStore((state) => state.id);
  const router = useRouter();
  const [formData, setFormData] = useState({
    issueTitle: "",
    description: "",
    location: "",
    priority: "",
    image_files: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("report");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState<
    Maintainance[]
  >([]);
  const [images, setImages] = useState<
    { id: number; file: File; preview: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        id: Date.now() + Math.random(),
        file,
        preview: URL.createObjectURL(file),
      }));
      setImages((prev) => [...prev, ...newFiles]);
    }
  };

  const filteredHistory = maintenanceRequests.filter((item) => {
    const matchesSearch = Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    );
    const matchesStatus =
      statusFilter === "all" ||
      item.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const removeImage = (id: number) => {
    setImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      return filtered;
    });
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // create maintenance request

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value, // Dynamically update the field based on its id
    }));
  };

  const handleSubmit = async () => {
    if (!session?.access) {
      console.error("No session or token found!");
      return;
    }

    try {
      setLoading(true);

      // Create a FormData object
      const formDataToSend = new FormData();

      // Append text fields from formData
      formDataToSend.append("lease", leaseId.toString()); // Hardcoded for now, can be dynamic later
      formDataToSend.append("issueTitle", formData.issueTitle || "");
      formDataToSend.append("location", formData.location || "");
      formDataToSend.append("priority", formData.priority || "");
      formDataToSend.append("description", formData.description || "");

      // Append uploaded images
      images.forEach((image) => {
        formDataToSend.append("image_files", image.file); // 'images' is the key expected by the backend
      });

      const response = await Axios.post(
        "/tenants/maintanance-requests/",
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${session.access}`, // Use token from session
            "Content-Type": "multipart/form-data",
          },
        }
      );
      toast("Success", {
        description: "Maintenance Request has been successfully submitted",
      });

      setFormData({
        issueTitle: "",
        description: "",
        location: "",
        priority: "",
        image_files: [],
      }); // Clear the form
      setImages([]); // Clear the uploaded images
      setLoading(false);
      window.location.reload();
    } catch (err) {
      console.error("Error submitting maintenance request:", err);
      toast("Error", {
        description: "Failed to submit maintenance request. Please try again.",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMaintenanceRequests = async () => {
      try {
        const response = await Axios.get("/tenants/maintanance-requests/", {
          headers: {
            Authorization: `Bearer ${session?.access}`, // Use token from session
          },
        });
        setMaintenanceRequests(response.data.data);
        setLoading(false);
      } catch (err) {
        // setError(err.message);
        setLoading(false);
      }
    };

    fetchMaintenanceRequests();
  }, [session]);

  return !leaseId || leaseId === "0" || leaseId === "" ? (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground">
            View and manage your maintenance requests
          </p>
        </div>
      </div>

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
            maintenance requests here.
          </p>
          <Button onClick={() => router.push("/dashboard/inquiries")}>
            Check your Inquiries
          </Button>
        </CardContent>
      </Card>
    </div>
  ) : (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Maintenance</h1>
          <p className="text-muted-foreground">
            View and manage your maintenance requests
          </p>
        </div>
      </div>


      <Tabs
        defaultValue="report"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="report" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Report Issue</span>
            <span className="sm:hidden">Report</span>
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Active Requests</span>
            <span className="sm:hidden">Active</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Maintenance History</span>
            <span className="sm:hidden">History</span>
          </TabsTrigger>
        </TabsList>

        {/* Report Issue Tab */}
        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report a Maintenance Issue</CardTitle>
              <CardDescription>
                Please provide details about the maintenance issue you're
                experiencing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-2">
                  <Label htmlFor="issueTitle">Issue Title</Label>
                  <Input
                    id="issueTitle"
                    placeholder="e.g., Leaking faucet, Broken window"
                    value={formData.issueTitle}
                    onChange={handleInputChange} // Use the general input change handler
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        location: value, // Save the selected value in formData
                      }))
                    }
                  >
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="bathroom">Bathroom</SelectItem>
                      <SelectItem value="bedroom">Bedroom</SelectItem>
                      <SelectItem value="living-room">Living Room</SelectItem>
                      <SelectItem value="hallway">Hallway</SelectItem>
                      <SelectItem value="exterior">Exterior</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        priority: value, // Save the selected value in formData
                      }))
                    }
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        Low - Not urgent, can be fixed when convenient
                      </SelectItem>
                      <SelectItem value="normal">
                        Medium - Needs attention within a few days
                      </SelectItem>
                      <SelectItem value="high">
                        High - Urgent issue requiring immediate attention
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Please describe the issue in detail. Include when you first noticed it and any relevant information."
                    rows={5}
                    value={formData.description}
                    onChange={handleInputChange} // Use the general input change handler
                  />
                </div>

                <div className="space-y-2">
                  <Label>Photos</Label>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {images.map((img) => (
                      <div key={img.id} className="relative group">
                        <div className="w-32 h-32 rounded-md overflow-hidden border border-border">
                          <img
                            src={img.preview || "/placeholder.svg"}
                            alt="Issue preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(img.id)}
                          className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 shadow-sm opacity-90 hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="w-32 h-32 flex flex-col items-center justify-center border border-dashed border-muted-foreground/50 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Add Photos
                      </span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add photos to help us better understand and address the
                    issue. You can upload up to 5 images.
                  </p>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Submitting..." : "Submit Maintenance Request"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Active Requests Tab */}
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Maintenance Requests</CardTitle>
              <CardDescription>
                Track the status of your current maintenance requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-4 gap-2 grid grid-cols-2">
                {maintenanceRequests
                  .filter((req) => req.status !== "completed")
                  .map((request) => (
                    <Card key={request.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              {request.issueTitle}
                            </CardTitle>
                            <CardDescription>
                              Request ID: {request.id}
                              <p className="pt-2 italic">
                                {request.description}
                              </p>
                            </CardDescription>
                          </div>
                          <StatusBadge status={request.status} />
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="grid gap-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Location:
                            </span>
                            <span>{request.location}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Priority:
                            </span>
                            <PriorityBadge priority={request.priority} />
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Submitted:
                            </span>
                            <span>{formatDate(request.createdAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {request.images &&
                            request.images.map(
                              (
                                image: { id: number; image: string },
                                index: number
                              ) => (
                                <div
                                  key={index}
                                  className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden border border-border"
                                >
                                  <img
                                    src={image.image || "/placeholder.svg"}
                                    alt={`Issue photo ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )
                            )}
                        </div>
                      </CardFooter>
                      {/* <CardFooter className="flex justify-end pt-0">
                        <Button
                          variant="ghost"
                          className="text-primary"
                          onClick={() => setSelectedRequest(request)}
                        >
                          View Details
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </CardFooter> */}
                    </Card>
                  ))}

                {maintenanceRequests.filter((req) => req.status !== "Completed")
                  .length === 0 && (
                  <div className="text-center py-8">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <CheckCircle className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-1">
                      No active maintenance requests
                    </h3>
                    <p className="text-muted-foreground">
                      You don't have any active maintenance requests at the
                      moment.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setActiveTab("report")}
                    >
                      Report a New Issue
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
              <CardDescription>
                View your past maintenance requests and their resolutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search maintenance history..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select onValueChange={(value) => setStatusFilter(value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">ID</TableHead>
                      <TableHead>Issue</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      {/* <TableHead>Completed</TableHead> */}
                      {/* <TableHead className="text-right">Actions</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory
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
                          <TableCell>{request.description}</TableCell>
                          <TableCell>{request.location}</TableCell>
                          <TableCell>
                            <StatusBadge status={request.status} />
                          </TableCell>
                          <TableCell>{formatDate(request.createdAt)}</TableCell>
                          {/* <TableCell>
                            {request.completedDate
                              ? formatDate(request.completedDate)
                              : "-"}
                          </TableCell> */}
                          {/* <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                            >
                              Details
                            </Button>
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

      {/* Request Details Dialog */}
      {selectedRequest && (
        <Dialog
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
        >
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Maintenance Request Details</DialogTitle>
              <DialogDescription>
                Request ID: {selectedRequest.id}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid gap-2">
                <h3 className="font-medium">Issue</h3>
                <p>{selectedRequest.description}</p>
              </div>

              <div className="grid gap-2">
                <h3 className="font-medium">Description</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-1">Location</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedRequest.location}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Priority</h3>
                  <PriorityBadge priority={selectedRequest.priority} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-1">Status</h3>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Submitted</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(selectedRequest.createdAt)}
                  </p>
                </div>
              </div>

              {selectedRequest.photos && selectedRequest.photos.length > 0 && (
                <div className="grid gap-2">
                  <h3 className="font-medium">Photos</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedRequest.photos.map(
                      (photo: string, index: number) => (
                        <div
                          key={index}
                          className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden border border-border"
                        >
                          <img
                            src={photo || "/placeholder.svg"}
                            alt={`Issue photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* <div className="grid gap-2">
                <h3 className="font-medium">Request Timeline</h3>
                <div className="border rounded-md p-4">
                  <div className="space-y-6">
                    {selectedRequest.updates.map(
                      (update: any, index: number) => (
                        <div key={index} className="flex gap-4">
                          <div className="relative mt-1">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                update.status === "Completed"
                                  ? "bg-green-500"
                                  : update.status === "In Progress"
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                              }`}
                            ></div>
                            {index < selectedRequest.updates.length - 1 && (
                              <div className="absolute top-3 bottom-0 left-1.5 -ml-px w-[1px] bg-border"></div>
                            )}
                          </div>
                          <div className="pb-6">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {update.status}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(update.date)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {update.message}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div> */}

              {selectedRequest.status !== "Completed" && (
                <div className="grid gap-2">
                  <h3 className="font-medium">Add a Comment</h3>
                  <Textarea
                    placeholder="Add any additional information or questions about this maintenance request..."
                    rows={3}
                  />
                  <Button className="w-full sm:w-auto sm:self-end mt-2">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Comment
                  </Button>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

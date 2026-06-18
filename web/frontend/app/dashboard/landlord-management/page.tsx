"use client";

import { useEffect, useState } from "react";
import {
  User,
  Users,
  Home,
  Search,
  Shield,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Mail,
  Phone,
  Eye,
  Ban,
  Trash2,
  Clock,
  RotateCcw,
  ArrowUpDown,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
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

import Axios from "@/config/axios.config";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

// Utility function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
          Verified
        </Badge>
      );
    case "inactive":
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
    case "suspended":
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200"
        >
          <Ban className="h-3.5 w-3.5 mr-1" />
          Suspended
        </Badge>
      );
    case "binned":
      return (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          Binned
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
interface Landlord {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  dateJoined: string; // Join date from Django User model
  propertiesCount?: number; // Property count for landlords
  profile: {
    phone: string;
    status: string;
    createdByAgent: number;
  };
  isActive: boolean;
  role: string;
}

interface Property {
  id: number;
  name: string;
  address: string;
  rooms: number;
  price: number;
  status: string;
  createdAt: string;
}

export default function AdminLandlordVerification() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("verification");
  const [selectedLandlord, setSelectedLandlord] = useState<Landlord>();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [selectedLandlordId, setSelectedLandlordId] = useState<number>();
  const [landlordProperties, setLandlordProperties] = useState<Property[]>([]);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionNotes, setSuspensionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");

  // Filter landlords based on search query and status filter
  const filteredLandlords = landlords.filter((landlord) => {
    const matchesSearch =
      landlord.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      landlord.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      landlord.lastName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      landlord.profile.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Get pending verification count
  const pendingVerificationCount = landlords.filter(
    (landlord) => landlord.profile.status === "inactive"
  ).length;

  const fetchLandlords = async () => {
    try {
      const response = await Axios.get(`/users/landlord/`, {
        headers: {
          Authorization: `Bearer ${session?.access}`, // Use token from session
        },
      });
      // const installments = response.data.data;
      setLandlords(response.data.users);
      console.log("Fetched landlords:", response.data.users);
    } catch (err) {
      console.error("Error fetching landlord data:", err);
    }
  };

  const fetchLandlordProperties = async (landlordId: number) => {
    try {
      const response = await Axios.get(`/properties/landlord/${landlordId}/`, {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
      });
      setLandlordProperties(response.data.data || []);
    } catch (err) {
      console.error("Error fetching landlord properties:", err);
      setLandlordProperties([]);
    }
  };

  // Function to handle landlord selection and fetch their properties
  const handleLandlordSelect = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setActiveTab("details");
    fetchLandlordProperties(landlord.id);
  };
  useEffect(() => {
    if (!session?.access) return;

    fetchLandlords();
  }, [session]);

  const handleApproveUser = async (userId: number) => {
    try {
      if (!session?.access) {
        console.error("No session or token found!");
        return;
      }

      // Find the landlord being approved
      const landlord = landlords.find((l) => l.id === userId);
      if (!landlord) {
        console.error("Landlord not found!");
        return;
      }

      const response = await Axios.patch(
        `/users/approve/${userId}/`, // Endpoint with dynamic user ID
        {}, // Empty body for the PATCH request
        {
          headers: {
            Authorization: `Bearer ${session.access}`, // Use token from session
          },
        }
      );

      // Send approval notification
      await sendApprovalNotification(userId, landlord);

      toast("Success", {
        description: `${landlord.firstName} ${landlord.lastName} has been approved and notified.`,
      });

      // Optionally, refresh the list of landlords or update the UI
      fetchLandlords(); // Call your fetch function to refresh the list
    } catch (err: any) {
      console.error(
        `Error approving user ${userId}:`,
        err.response?.data || err.message
      );
      toast("Error", {
        description: `Failed to approve user ${userId}. Please try again.`,
      });
    }
  };

  const sendReactivationNotification = async (
    landlordId: number,
    landlord: Landlord
  ) => {
    try {
      if (!session?.access) {
        console.error("No session or token found!");
        return;
      }

      // Create notification for the reactivated landlord
      const notificationData = {
        recipient_id: landlordId,
        notification_type: "general",
        title: "Account Reactivated",
        message: `Your landlord account has been reactivated. You can now access all features and continue managing your properties on Student Moves.`,
        priority: "medium",
        metadata: {
          action_type: "account_reactivation",
        },
      };

      const response = await Axios.post(
        "/notifications/create/",
        notificationData,
        {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        }
      );
    } catch (err: any) {
      console.error(
        "Error sending reactivation notification:",
        err.response?.data || err.message
      );
      toast("Warning", {
        description: "Account reactivated but notification failed to send.",
      });
    }
  };

  const sendApprovalNotification = async (
    landlordId: number,
    landlord: Landlord
  ) => {
    try {
      if (!session?.access) {
        console.error("No session or token found!");
        return;
      }

      // Create notification for the approved landlord
      const notificationData = {
        recipient_id: landlordId,
        notification_type: "general",
        title: "Verification Approved",
        message: `Congratulations! Your landlord verification has been approved. You can now start listing your properties and managing your rental business on Student Moves.`,
        priority: "medium",
        metadata: {
          action_type: "verification_approval",
        },
      };

      const response = await Axios.post(
        "/notifications/create/",
        notificationData,
        {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        }
      );
    } catch (err: any) {
      console.error(
        "Error sending approval notification:",
        err.response?.data || err.message
      );
      toast("Warning", {
        description: "User approved but notification failed to send.",
      });
    }
  };

  const sendRejectionNotification = async (
    landlordId: number,
    landlord: Landlord,
    reason: string,
    notes: string
  ) => {
    try {
      if (!session?.access) {
        console.error("No session or token found!");
        return;
      }

      // Create notification for the rejected landlord
      const notificationData = {
        recipient_id: landlordId,
        notification_type: "general",
        title: "Verification Rejected",
        message: `Your landlord verification has been rejected. Reason: ${reason}. ${
          notes ? `Additional notes: ${notes}` : ""
        } Please review the requirements and resubmit your application with the correct documentation.`,
        priority: "high",
        metadata: {
          rejection_reason: reason,
          rejection_notes: notes,
          action_type: "verification_rejection",
        },
      };

      const response = await Axios.post(
        "/notifications/create/",
        notificationData,
        {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        }
      );
    } catch (err: any) {
      console.error(
        "Error sending rejection notification:",
        err.response?.data || err.message
      );
      toast("Warning", {
        description: "User rejected but notification failed to send.",
      });
    }
  };

  const sendSuspensionNotification = async (
    landlordId: number,
    landlord: Landlord,
    reason: string,
    notes: string
  ) => {
    try {
      if (!session?.access) {
        console.error("No session or token found!");
        return;
      }

      // Create notification for the suspended landlord
      const notificationData = {
        recipient_id: landlordId,
        notification_type: "general",
        title: "Account Suspended",
        message: `Your landlord account has been suspended. Reason: ${reason}. ${
          notes ? `Additional notes: ${notes}` : ""
        } Your properties will not be visible to the public until your account is reactivated.`,
        priority: "high",
        metadata: {
          suspension_reason: reason,
          suspension_notes: notes,
          action_type: "account_suspension",
        },
      };

      const response = await Axios.post(
        "/notifications/create/",
        notificationData,
        {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        }
      );
    } catch (err: any) {
      console.error(
        "Error sending suspension notification:",
        err.response?.data || err.message
      );
      toast("Warning", {
        description: "User suspended but notification failed to send.",
      });
    }
  };

  const handleSuspendUser = async (
    userId: number,
    reason?: string,
    notes?: string
  ) => {
    try {
      if (!session?.access) {
        console.error("No session or token found!");
        return;
      }

      // Find the landlord being suspended
      const landlord = landlords.find((l) => l.id === userId);
      if (!landlord) {
        console.error("Landlord not found!");
        return;
      }

      const response = await Axios.patch(
        `/users/suspend/${userId}/`, // Endpoint with dynamic user ID
        {}, // Empty body for the PATCH request
        {
          headers: {
            Authorization: `Bearer ${session.access}`, // Use token from session
          },
        }
      );

      // Send suspension notification
      await sendSuspensionNotification(
        userId,
        landlord,
        reason || suspensionReason || "Policy violation",
        notes || suspensionNotes || ""
      );

      toast("Success", {
        description: `User ${landlord.firstName} ${landlord.lastName} has been suspended and notified.`,
      });

      // Optionally, refresh the list of landlords or update the UI
      fetchLandlords(); // Call your fetch function to refresh the list
    } catch (err: any) {
      console.error(
        `Error suspending user ${userId}:`,
        err.response?.data || err.message
      );
      toast("Error", {
        description: `Failed to suspend user ${userId}. Please try again.`,
      });
    }
  };

  const handleRemoveLandlord = async (landlord: Landlord) => {
    try {
      if (!session?.access) {
        console.error("No session or token found!");
        return;
      }

      // Use the new unified remove endpoint
      const response = await Axios.delete(
        `/users/landlord/${landlord.id}/remove/`,
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        }
      );

      if (response.data.status === "success") {
        toast("Success", {
          description: response.data.message,
        });

        // Refresh the landlord list
        fetchLandlords();
      } else {
        throw new Error(response.data.message || "Failed to remove landlord");
      }
    } catch (err: any) {
      console.error(
        "Error removing landlord:",
        err.response?.data || err.message
      );
      toast("Error", {
        description:
          err.response?.data?.message ||
          "Failed to remove landlord. Please try again.",
      });
    }
  };

  const handleRestoreLandlord = async (landlordId: number) => {
    try {
      if (!session?.access) {
        console.error("No session or token found!");
        return;
      }

      const response = await Axios.patch(
        `/users/landlord/${landlordId}/restore/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        }
      );

      if (response.data.status === "success") {
        toast("Success", {
          description: response.data.message,
        });

        // Refresh the landlord list
        fetchLandlords();
      } else {
        throw new Error(response.data.message || "Failed to restore landlord");
      }
    } catch (err: any) {
      console.error(
        "Error restoring landlord:",
        err.response?.data || err.message
      );
      toast("Error", {
        description:
          err.response?.data?.message ||
          "Failed to restore landlord. Please try again.",
      });
    }
  };

  const handleReactivateUser = async (userId: number) => {
    try {
      if (!session?.access) {
        console.error("No session or token found!");
        return;
      }

      // Find the landlord being reactivated
      const landlord = landlords.find((l) => l.id === userId);
      if (!landlord) {
        console.error("Landlord not found!");
        return;
      }

      const response = await Axios.patch(
        `/users/approve/${userId}/`, // Using approve endpoint to reactivate
        {}, // Empty body for the PATCH request
        {
          headers: {
            Authorization: `Bearer ${session.access}`, // Use token from session
          },
        }
      );

      // Send reactivation notification
      await sendReactivationNotification(userId, landlord);

      toast("Success", {
        description: `${landlord.firstName} ${landlord.lastName} has been reactivated and notified.`,
      });

      // Optionally, refresh the list of landlords or update the UI
      fetchLandlords(); // Call your fetch function to refresh the list
    } catch (err: any) {
      console.error(
        `Error reactivating user ${userId}:`,
        err.response?.data || err.message
      );
      toast("Error", {
        description: `Failed to reactivate user ${userId}. Please try again.`,
      });
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Landlord Management</h1>
          <p className="text-muted-foreground">
            Verify and manage landlord accounts
          </p>
        </div>
        {/* <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Advanced Filters</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div> */}
      </div>

      <Tabs
        defaultValue="verification"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Verification Queue</span>
            <span className="sm:hidden">Verify</span>
            {pendingVerificationCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingVerificationCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="landlords" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">All Landlords</span>
            <span className="sm:hidden">Landlords</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Landlord Details</span>
            <span className="sm:hidden">Details</span>
          </TabsTrigger>
        </TabsList>

        {/* Verification Queue Tab */}
        <TabsContent value="verification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Verification</CardTitle>
              <CardDescription>
                Review and verify landlord accounts awaiting approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {landlords.filter(
                (landlord) => landlord.profile.status === "inactive"
              ).length > 0 ? (
                <div className="space-y-4">
                  {landlords
                    .filter(
                      (landlord) => landlord.profile.status === "inactive"
                    )
                    .map((landlord) => (
                      <Card
                        key={landlord.id}
                        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                        onDoubleClick={() => handleLandlordSelect(landlord)}
                      >
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-12 w-12">
                                {/* <AvatarImage
                                  src={landlord.avatar}
                                  alt={landlord.firstName}
                                /> */}
                                <AvatarFallback>
                                  {landlord.firstName.substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {landlord.firstName} {landlord.lastName}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {landlord.email}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                  {landlord.propertiesCount !== undefined && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Home className="h-3 w-3" />
                                      <span>
                                        {landlord.propertiesCount}{" "}
                                        {landlord.propertiesCount === 1
                                          ? "Property"
                                          : "Properties"}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      Joined {formatDate(landlord.dateJoined)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLandlordSelect(landlord)}
                              >
                                <Eye className="mr-1.5 h-4 w-4" />
                                View Details
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproveUser(landlord.id)}
                              >
                                <CheckCircle className="mr-1.5 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedLandlordId(landlord.id); // Set the landlord ID
                                  setRejectDialogOpen(true); // Open the dialog
                                }}
                              >
                                <XCircle className="mr-1.5 h-4 w-4" />
                                Suspend
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    No pending verifications
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    All landlord accounts have been reviewed. New verification
                    requests will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Verification Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                      <span>Pending</span>
                    </div>
                    <span className="font-medium">
                      {
                        landlords.filter((l) => l.profile.status === "inactive")
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <span>Verified</span>
                    </div>
                    <span className="font-medium">
                      {
                        landlords.filter((l) => l.profile.status === "active")
                          .length
                      }
                    </span>
                  </div>
                  {/* <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <span>Rejected</span>
                    </div>
                    <span className="font-medium">
                      {
                        landlords.filter((l) => l.profile.status === "rejected")
                          .length
                      }
                    </span>
                  </div> */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Ban className="h-4 w-4 text-purple-600" />
                      </div>
                      <span>Suspended</span>
                    </div>
                    <span className="font-medium">
                      {
                        landlords.filter(
                          (l) => l.profile.status === "suspended"
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Verification Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <p>Verify government-issued ID matches applicant name.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <p>Confirm business registration is valid and current.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <p>
                      Check property ownership documents match registered
                      properties.
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <p>
                      Request additional information if documents are unclear.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* All Landlords Tab */}
        <TabsContent value="landlords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Landlords</CardTitle>
              <CardDescription>
                View and manage all landlord accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search landlords by name, email, or company..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Verified</SelectItem>
                    <SelectItem value="inactive">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox />
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Landlord
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                          >
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableHead>
                      <TableHead>Properties</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By Agent</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLandlords.map((landlord) => (
                      <TableRow
                        key={landlord.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onDoubleClick={() => handleLandlordSelect(landlord)}
                      >
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              {/* <AvatarImage
                                src={landlord.avatar}
                                alt={landlord.name}
                              /> */}
                              <AvatarFallback>
                                {landlord.firstName.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {landlord.firstName} {landlord.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {landlord.email}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Joined {formatDate(landlord.dateJoined)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {landlord.propertiesCount !== undefined ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              <Home className="h-3 w-3 mr-1" />
                              {landlord.propertiesCount}{" "}
                              {landlord.propertiesCount === 1
                                ? "Property"
                                : "Properties"}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              N/A
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-muted-foreground">
                              ID: {landlord.id}
                            </div>
                            <div className="text-muted-foreground">
                              Role: {landlord.role}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={landlord.profile.status} />
                        </TableCell>
                        <TableCell align="center">
                          {landlord.profile.createdByAgent ? "Yes" : "No"}
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
                                onClick={() => handleLandlordSelect(landlord)}
                              >
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {landlord.profile.status === "inactive" && (
                                <>
                                  <DropdownMenuItem className="text-green-600">
                                    Approve verification
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => {
                                      setRejectDialogOpen(true);
                                      handleSuspendUser(landlord.id);
                                    }}
                                  >
                                    Reject verification
                                  </DropdownMenuItem>
                                </>
                              )}
                              {landlord.profile.status === "active" && (
                                <DropdownMenuItem
                                  className="text-purple-600"
                                  onClick={() => {
                                    setSelectedLandlord(landlord);
                                    setSuspendDialogOpen(true);
                                  }}
                                >
                                  Suspend account
                                </DropdownMenuItem>
                              )}
                              {landlord.profile.status === "suspended" && (
                                <DropdownMenuItem
                                  className="text-green-600"
                                  onClick={() =>
                                    handleReactivateUser(landlord.id)
                                  }
                                >
                                  Reactivate account
                                </DropdownMenuItem>
                              )}
                              {landlord.profile.status === "binned" && (
                                <DropdownMenuItem
                                  className="text-blue-600"
                                  onClick={() =>
                                    handleRestoreLandlord(landlord.id)
                                  }
                                >
                                  Restore from bin
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
        </TabsContent>

        {/* Landlord Details Tab */}
        <TabsContent value="details" className="space-y-4">
          {selectedLandlord ? (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>Landlord Information</CardTitle>
                        <CardDescription>
                          Personal and business details
                        </CardDescription>
                      </div>
                      <StatusBadge status={selectedLandlord.profile.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="h-16 w-16">
                        {/* <AvatarImage
                          src={selectedLandlord.avatar}
                          alt={selectedLandlord.name}
                        /> */}
                        <AvatarFallback>
                          {selectedLandlord.firstName.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-xl font-bold">
                          {selectedLandlord.firstName}{" "}
                          {selectedLandlord.lastName}
                        </h2>
                        <p className="text-muted-foreground">Landlord</p>
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
                            <span>{selectedLandlord.email}</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Phone Number
                          </h3>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedLandlord.profile.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Properties
                          </h3>
                          <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {selectedLandlord.propertiesCount !== undefined
                                ? `${selectedLandlord.propertiesCount} ${
                                    selectedLandlord.propertiesCount === 1
                                      ? "property"
                                      : "properties"
                                  }`
                                : "No properties"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Joined
                          </h3>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {formatDate(selectedLandlord.dateJoined)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Agent Created
                      </h3>
                      <p className="text-sm">{selectedLandlord.profile.createdByAgent ? `Yes (by Agent Id #${selectedLandlord.profile.createdByAgent})` : "No"}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card> 
                  <CardHeader>
                    <CardTitle>Properties</CardTitle>
                    <CardDescription>
                      Properties managed by this landlord
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {landlordProperties.length > 0 ? (
                      <>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Property</TableHead>
                                <TableHead>Rooms</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {landlordProperties.map((property) => (
                                <TableRow key={property.id}>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">
                                        {property.name ||
                                          `Property ${property.id}`}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {property.address}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{property.rooms}</TableCell>
                                  <TableCell>£{property.price}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={
                                        property.status === "available"
                                          ? "bg-green-50 text-green-700 border-green-200"
                                          : property.status === "rented_out"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : property.status === "pending"
                                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                          : "bg-red-50 text-red-700 border-red-200"
                                      }
                                    >
                                      {property.status.charAt(0).toUpperCase() +
                                        property.status
                                          .slice(1)
                                          .replace("_", " ")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">
                                      <Eye className="mr-1.5 h-4 w-4" />
                                      View
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {landlordProperties.length > 5 && (
                          <Button variant="outline" className="mt-4 w-full">
                            View All {landlordProperties.length} Properties
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Home className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">
                          No Properties
                        </h3>
                        <p className="text-muted-foreground">
                          This landlord hasn't added any properties yet.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Verification Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-6">
                      <div
                        className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
                          selectedLandlord.profile.status === "active"
                            ? "bg-green-100"
                            : selectedLandlord.profile.status === "inactive"
                            ? "bg-yellow-100"
                            : selectedLandlord.profile.status === "rejected"
                            ? "bg-red-100"
                            : selectedLandlord.profile.status === "suspended"
                            ? "bg-purple-100"
                            : selectedLandlord.profile.status === "binned"
                            ? "bg-orange-100"
                            : "bg-gray-100"
                        }`}
                      >
                        {selectedLandlord.profile.status === "active" && (
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        )}
                        {selectedLandlord.profile.status === "inactive" && (
                          <Clock className="h-8 w-8 text-yellow-600" />
                        )}
                        {selectedLandlord.profile.status === "rejected" && (
                          <XCircle className="h-8 w-8 text-red-600" />
                        )}
                        {selectedLandlord.profile.status === "suspended" && (
                          <Ban className="h-8 w-8 text-purple-600" />
                        )}
                        {selectedLandlord.profile.status === "binned" && (
                          <Trash2 className="h-8 w-8 text-orange-600" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-1">
                        {selectedLandlord.profile.status
                          .charAt(0)
                          .toUpperCase() +
                          selectedLandlord.profile.status.slice(1)}
                      </h3>
                      <p className="text-sm text-muted-foreground text-center mb-6">
                        {selectedLandlord.profile.status === "active" &&
                          "This landlord has been verified and can list properties."}
                        {selectedLandlord.profile.status === "inactive" &&
                          "This landlord is awaiting verification."}
                        {selectedLandlord.profile.status === "rejected" &&
                          "This landlord's verification has been rejected."}
                        {selectedLandlord.profile.status === "suspended" &&
                          "This landlord's account has been suspended."}
                        {selectedLandlord.profile.status === "binned" &&
                          "This landlord's account has been temporarily removed and can be restored."}
                      </p>

                      {selectedLandlord.profile.status === "inactive" && (
                        <div className="flex gap-2 w-full">
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveUser(selectedLandlord.id)}
                          >
                            <CheckCircle className="mr-1.5 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => setRejectDialogOpen(true)}
                          >
                            <XCircle className="mr-1.5 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {selectedLandlord.profile.status === "active" && (
                        <Button
                          variant="outline"
                          className="w-full text-purple-600 border-purple-200 hover:bg-purple-50"
                          onClick={() => setSuspendDialogOpen(true)}
                        >
                          <Ban className="mr-1.5 h-4 w-4" />
                          Suspend Account
                        </Button>
                      )}

                      {selectedLandlord.profile.status === "suspended" && (
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            handleReactivateUser(selectedLandlord.id)
                          }
                        >
                          <CheckCircle className="mr-1.5 h-4 w-4" />
                          Reactivate Account
                        </Button>
                      )}

                      {selectedLandlord.profile.status === "binned" && (
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() =>
                            handleRestoreLandlord(selectedLandlord.id)
                          }
                        >
                          <RotateCcw className="mr-1.5 h-4 w-4" />
                          Restore Account
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <CardTitle>Actions</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() =>
                          window.open(`mailto:${selectedLandlord.email}`)
                        }
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Contact Landlord
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-destructive hover:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Landlord
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Remove Landlord Account
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will remove{" "}
                              {selectedLandlord.firstName}{" "}
                              {selectedLandlord.lastName} from the platform.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <div className="py-4">
                            {landlordProperties.length > 0 ? (
                              <div className="space-y-4">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                    <div>
                                      <h4 className="font-medium text-yellow-800">
                                        Landlord Has Properties
                                      </h4>
                                      <p className="text-sm text-yellow-700 mt-1">
                                        This landlord has{" "}
                                        <strong>
                                          {landlordProperties.length} propert
                                          {landlordProperties.length === 1
                                            ? "y"
                                            : "ies"}
                                        </strong>
                                        . The account will be moved to a 7-day
                                        deletion period.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-medium">
                                    What happens next:
                                  </h4>
                                  <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                                    <li>
                                      • Landlord account will be deactivated
                                      immediately
                                    </li>
                                    <li>
                                      • All properties will be hidden from
                                      public view
                                    </li>
                                    <li>
                                      • 7-day grace period starts for potential
                                      restoration
                                    </li>
                                    <li>
                                      • After 7 days, account and properties are
                                      permanently deleted
                                    </li>
                                    <li>
                                      • Landlord will receive notification about
                                      the action
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                  <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                    <div>
                                      <h4 className="font-medium text-red-800">
                                        No Properties Found
                                      </h4>
                                      <p className="text-sm text-red-700 mt-1">
                                        This landlord has no properties. The
                                        account will be removed immediately.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-medium">
                                    What happens next:
                                  </h4>
                                  <ul className="text-sm space-y-1 text-muted-foreground ml-4">
                                    <li>
                                      • Landlord account will be permanently
                                      deleted
                                    </li>
                                    <li>
                                      • All associated data will be removed
                                    </li>
                                    <li>• This action cannot be undone</li>
                                    <li>
                                      • Landlord will receive notification about
                                      the removal
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-white hover:bg-destructive/90"
                              onClick={() =>
                                handleRemoveLandlord(selectedLandlord)
                              }
                            >
                              {landlordProperties.length > 0
                                ? "Move to Bin (7 days)"
                                : "Remove Permanently"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
                  No landlord selected
                </h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Select a landlord from the list to view their details and
                  manage their account.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("landlords")}
                >
                  View All Landlords
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Verification Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this landlord's
              verification.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Select
                value={rejectionReason}
                onValueChange={setRejectionReason}
              >
                <SelectTrigger id="reject-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="incomplete">
                    Incomplete Documentation
                  </SelectItem>
                  <SelectItem value="unclear">
                    Unclear or Illegible Documents
                  </SelectItem>
                  <SelectItem value="mismatch">Information Mismatch</SelectItem>
                  <SelectItem value="expired">Expired Documents</SelectItem>
                  <SelectItem value="other">Other (Please Specify)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reject-notes">Additional Notes</Label>
              <Textarea
                id="reject-notes"
                placeholder="Provide additional details about the rejection reason..."
                rows={4}
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Request Additional Documents</Label>
              <div className="flex items-center space-x-2">
                <Checkbox id="request-id" />
                <Label htmlFor="request-id" className="font-normal">
                  Government-issued ID
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="request-business" />
                <Label htmlFor="request-business" className="font-normal">
                  Business Registration
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="request-property" />
                <Label htmlFor="request-property" className="font-normal">
                  Property Ownership Proof
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (selectedLandlordId !== undefined) {
                  // Find the landlord being rejected
                  const landlord = landlords.find(
                    (l) => l.id === selectedLandlordId
                  );
                  if (landlord) {
                    await handleSuspendUser(selectedLandlordId);
                    await sendRejectionNotification(
                      selectedLandlordId,
                      landlord,
                      rejectionReason || "Verification requirements not met",
                      rejectionNotes || ""
                    );
                  }
                } else {
                  console.error("No landlord ID selected for rejection.");
                }
                setRejectDialogOpen(false);
                // Reset form
                setRejectionReason("");
                setRejectionNotes("");
              }}
            >
              Reject Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Account Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Landlord Account</DialogTitle>
            <DialogDescription>
              Please provide a reason for suspending this landlord's account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="suspend-reason">Suspension Reason</Label>
              <Select
                value={suspensionReason}
                onValueChange={setSuspensionReason}
              >
                <SelectTrigger id="suspend-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complaints">
                    Multiple Tenant Complaints
                  </SelectItem>
                  <SelectItem value="maintenance">
                    Maintenance Issues
                  </SelectItem>
                  <SelectItem value="payments">Payment Issues</SelectItem>
                  <SelectItem value="policy">Policy Violations</SelectItem>
                  <SelectItem value="other">Other (Please Specify)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="suspend-notes">Additional Notes</Label>
              <Textarea
                id="suspend-notes"
                placeholder="Provide additional details about the suspension reason..."
                rows={4}
                value={suspensionNotes}
                onChange={(e) => setSuspensionNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSuspendDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedLandlord) {
                  handleSuspendUser(
                    selectedLandlord.id,
                    suspensionReason,
                    suspensionNotes
                  );
                }
                setSuspendDialogOpen(false);
                // Reset form
                setSuspensionReason("");
                setSuspensionNotes("");
              }}
            >
              Suspend Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

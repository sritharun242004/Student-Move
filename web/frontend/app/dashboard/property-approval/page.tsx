"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Flag,
  MapPin,
  Bath,
  Bed,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Clock,
  Settings,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { toast } from "sonner";
import Axios from "@/config/axios.config";

interface Property {
  id: number;
  name: string;
  address: string;
  city?: {
    name: string;
  };
  area?: {
    name: string;
  };
  price: string;
  rooms: number;
  bathrooms: number;
  status: "pending" | "flagged" | "available" | "rented_out";
  land_lord?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  description: string;
  bills_included: boolean;
  utility_amount?: string;
  universities?: Array<{
    id: number;
    name: string;
  }>;
  images?: Array<{
    id: number;
    image: string;
  }>;
  avalible_after?: string;
  security_deposit?: string;
  holding_deposit?: string;
}

interface ApiResponse {
  status: string;
  message: string;
  data: Property[];
}

export default function PropertyApproval() {
  const { data: session } = useSession();
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [flaggedProperties, setFlaggedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [utilityDialogOpen, setUtilityDialogOpen] = useState(false);
  const [utilityAmount, setUtilityAmount] = useState<string>("");
  const [propertyToApprove, setPropertyToApprove] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [autoApprovalEnabled, setAutoApprovalEnabled] = useState<boolean>(false);
  const [autoApprovalLoading, setAutoApprovalLoading] = useState(true);

  // Fetch auto-approval setting
  const fetchAutoApprovalSetting = async () => {
    try {
      const response = await Axios.get("/properties/settings/auto_approve_properties/");
      
      if (response.data.status === "success") {
        setAutoApprovalEnabled(response.data.data.setting_value);
      }
    } catch (error) {
      console.error("Error fetching auto-approval setting:", error);
      // Default to false if we can't fetch the setting
      setAutoApprovalEnabled(false);
    } finally {
      setAutoApprovalLoading(false);
    }
  };

  // Fetch pending properties
  const fetchPendingProperties = async () => {
    try {
      if (!session?.access) return;

      const response = await Axios.get<ApiResponse>("/properties/pending/", {
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
      });

      if (response.data.status === "success") {
        setPendingProperties(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching pending properties:", error);
      toast.error("Failed to fetch pending properties");
    }
  };

  // Fetch flagged properties
  const fetchFlaggedProperties = async () => {
    try {
      if (!session?.access) return;

      const response = await Axios.get<ApiResponse>("/properties/flagged/", {
        headers: {
          Authorization: `Bearer ${session.access}`,
        },
      });

      if (response.data.status === "success") {
        setFlaggedProperties(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching flagged properties:", error);
      toast.error("Failed to fetch flagged properties");
    }
  };

  // Approve property with utility amount update
  const handleApproveProperty = async (propertyId: number, utilityAmount?: string) => {
    try {
      if (!session?.access) return;

      // First update utility amount if provided
      if (utilityAmount) {
        await Axios.patch(
          `/properties/${propertyId}/`,
          { utility_amount: parseFloat(utilityAmount) },
          {
            headers: {
              Authorization: `Bearer ${session.access}`,
            },
          }
        );
      }

      // Then approve the property
      const response = await Axios.patch(
        `/properties/${propertyId}/approve/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        }
      );

      if (response.data.status === "success") {
        toast.success("Property approved successfully");
        // Refresh both lists
        fetchPendingProperties();
        fetchFlaggedProperties();
      }
    } catch (error) {
      console.error("Error approving property:", error);
      toast.error("Failed to approve property");
    }
  };

  // Show utility dialog before approving
  const handleApproveClick = (property: Property) => {
    setPropertyToApprove(property);
    setUtilityAmount(property.utility_amount?.toString() || "30");
    setUtilityDialogOpen(true);
  };

  // Confirm approval with utility amount
  const handleConfirmApproval = async () => {
    if (!propertyToApprove) return;
    
    await handleApproveProperty(propertyToApprove.id, utilityAmount);
    setUtilityDialogOpen(false);
    setPropertyToApprove(null);
    setUtilityAmount("");
  };

  // Flag property
  const handleFlagProperty = async (propertyId: number) => {
    try {
      if (!session?.access) return;

      const response = await Axios.patch(
        `/properties/${propertyId}/flag/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session.access}`,
          },
        }
      );

      if (response.data.status === "success") {
        toast.success("Property flagged successfully");
        // Refresh pending list
        fetchPendingProperties();
        fetchFlaggedProperties();
      }
    } catch (error) {
      console.error("Error flagging property:", error);
      toast.error("Failed to flag property");
    }
  };

  useEffect(() => {
    if (session?.access) {
      Promise.all([
        fetchPendingProperties(), 
        fetchFlaggedProperties(),
        fetchAutoApprovalSetting()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [session?.access]);

  // Filter properties based on search term
  const filterProperties = (properties: Property[]) => {
    if (!searchTerm) return properties;

    return properties.filter(
      (property) =>
        property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.area?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${property.land_lord?.first_name || ""} ${
          property.land_lord?.last_name || ""
        }`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  };

  const filteredPendingProperties = filterProperties(pendingProperties);
  const filteredFlaggedProperties = filterProperties(flaggedProperties);

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
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
      case "flagged":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            <Flag className="h-3.5 w-3.5 mr-1" />
            Flagged
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: string) => {
    return `£${parseFloat(price).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading properties...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Property Approval
          </h1>
          <p className="text-muted-foreground">
            Review and manage pending and flagged property listings
          </p>
        </div>
      </div>

      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Properties
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingProperties.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review and approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Flagged Properties
            </CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{flaggedProperties.length}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention or review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Auto-Approval Status Alert */}
      {!autoApprovalLoading && (
        <Alert className={autoApprovalEnabled ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
          <Settings className="h-4 w-4" />
          <AlertTitle>
            Auto-Approval {autoApprovalEnabled ? "Enabled" : "Disabled"}
          </AlertTitle>
          <AlertDescription>
            {autoApprovalEnabled ? (
              <>
                Property listings are automatically approved upon submission. No manual review is required.
                To change this settings, go to the Settings Tab and modify the property management settings.
              </>
            ) : (
              <>
                Property listings require manual approval. All new submissions will appear in the pending tab below.
                To enable auto-approval, go to the Settings Tab and modify the property management settings.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by property name, address, city, or landlord..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      

      {/* Tabs for Pending and Flagged */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" disabled={autoApprovalEnabled}>
            Pending ({filteredPendingProperties.length})
          </TabsTrigger>
          <TabsTrigger value="flagged">
            Flagged ({filteredFlaggedProperties.length})
          </TabsTrigger>
        </TabsList>

        {/* Show disabled message when auto-approval is enabled */}
            <TabsContent value="pending" className="space-y-4">
        {autoApprovalEnabled ? (
          <div className="mt-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Property Approval Disabled</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Auto-approval is currently enabled. All property listings are automatically approved upon submission. 
                  To review properties manually, please disable auto-approval in the Django Admin panel.
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Pending Properties Tab */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Property Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Landlord</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPendingProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{property.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {property.address}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {property.land_lord?.first_name || "N/A"}{" "}
                              {property.land_lord?.last_name || ""}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {property.land_lord?.email || "No email"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.city?.name || "Unknown"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {property.area?.name || "Unknown"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatPrice(property.price)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {property.bills_included
                              ? "Bills included"
                              : "Bills not included"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Bed className="h-3 w-3" />
                              {property.rooms}
                            </div>
                            <div className="flex items-center gap-1">
                              <Bath className="h-3 w-3" />
                              {property.bathrooms}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(property.created_at)}</TableCell>
                        <TableCell>
                          <StatusBadge status={property.status} />
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
                                  setSelectedProperty(property);
                                  setDetailsDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleApproveClick(property)
                                }
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve property
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleFlagProperty(property.id)}
                                className="text-red-600"
                              >
                                <Flag className="h-4 w-4 mr-2" />
                                Flag property
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredPendingProperties.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending properties found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
                  </>
        )}
        </TabsContent>

        {/* Flagged Properties Tab */}
        <TabsContent value="flagged" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flagged Property Listings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Property</TableHead>
                      <TableHead>Landlord</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFlaggedProperties.map((property) => (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{property.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {property.address}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">
                              {property.land_lord?.first_name || "N/A"}{" "}
                              {property.land_lord?.last_name || ""}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {property.land_lord?.email || "No email"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.city?.name || "Unknown"}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {property.area?.name || "Unknown"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatPrice(property.price)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {property.bills_included
                              ? "Bills included"
                              : "Bills not included"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Bed className="h-3 w-3" />
                              {property.rooms}
                            </div>
                            <div className="flex items-center gap-1">
                              <Bath className="h-3 w-3" />
                              {property.bathrooms}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={property.status} />
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
                                  setSelectedProperty(property);
                                  setDetailsDialogOpen(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleApproveClick(property)
                                }
                                className="text-green-600"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve property
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredFlaggedProperties.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No flagged properties found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
            </TabsContent>

      </Tabs>

      {/* Property Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Property Details</DialogTitle>
            <DialogDescription>
              Review detailed information about this property
            </DialogDescription>
          </DialogHeader>

          {selectedProperty && (
            <div className="space-y-6">
              {/* Property Images */}
              {selectedProperty.images &&
                selectedProperty.images.length > 0 && (
                  <div className="space-y-2">
                    <Label>Property Images</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {selectedProperty.images.map((image, index) => (
                        <img
                          key={image.id}
                          src={image.image}
                          alt={`Property ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md border"
                        />
                      ))}
                    </div>
                  </div>
                )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Property Name</Label>
                  <div className="p-2 bg-muted rounded">
                    {selectedProperty.name}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="p-2 bg-muted rounded">
                    <StatusBadge status={selectedProperty.status} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <div className="p-2 bg-muted rounded">
                    {selectedProperty.address}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="p-2 bg-muted rounded">
                    {selectedProperty.city?.name || "Unknown"},{" "}
                    {selectedProperty.area?.name || "Unknown"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <div className="p-2 bg-muted rounded font-medium">
                    {formatPrice(selectedProperty.price)}
                    {selectedProperty.bills_included && (
                      <span className="text-sm text-muted-foreground ml-2">
                        (Bills included)
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Available After</Label>
                  <div className="p-2 bg-muted rounded">
                    {selectedProperty.avalible_after
                      ? formatDate(selectedProperty.avalible_after)
                      : "Immediately"}
                  </div>
                </div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bedrooms</Label>
                  <div className="p-2 bg-muted rounded flex items-center gap-2">
                    <Bed className="h-4 w-4" />
                    {selectedProperty.rooms}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bathrooms</Label>
                  <div className="p-2 bg-muted rounded flex items-center gap-2">
                    <Bath className="h-4 w-4" />
                    {selectedProperty.bathrooms}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Bills Included</Label>
                  <div className="p-2 bg-muted rounded">
                    {selectedProperty.bills_included ? "Yes" : "No"}
                  </div>
                </div>
                {selectedProperty.utility_amount && (
                  <div className="space-y-2">
                    <Label>Utility Amount</Label>
                    <div className="p-2 bg-muted rounded">
                      £{parseFloat(selectedProperty.utility_amount).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>

              {/* Deposits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedProperty.security_deposit && (
                  <div className="space-y-2">
                    <Label>Security Deposit</Label>
                    <div className="p-2 bg-muted rounded">
                      {formatPrice(selectedProperty.security_deposit)}
                    </div>
                  </div>
                )}
                {selectedProperty.holding_deposit && (
                  <div className="space-y-2">
                    <Label>Holding Deposit</Label>
                    <div className="p-2 bg-muted rounded">
                      {formatPrice(selectedProperty.holding_deposit)}
                    </div>
                  </div>
                )}
              </div>

              {/* Universities */}
              {selectedProperty.universities &&
                selectedProperty.universities.length > 0 && (
                  <div className="space-y-2">
                    <Label>Nearby Universities</Label>
                    <div className="p-2 bg-muted rounded">
                      {selectedProperty.universities
                        .map((uni) => uni.name)
                        .join(", ")}
                    </div>
                  </div>
                )}

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <div className="p-2 bg-muted rounded whitespace-pre-wrap">
                  {selectedProperty.description}
                </div>
              </div>

              {/* Landlord Information */}
              <div className="space-y-2">
                <Label>Landlord Information</Label>
                <div className="p-4 bg-muted rounded space-y-2">
                  <div className="font-medium">
                    {selectedProperty.land_lord?.first_name || "N/A"}{" "}
                    {selectedProperty.land_lord?.last_name || ""}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedProperty.land_lord?.email || "No email"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Username: {selectedProperty.land_lord?.username || "N/A"}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setDetailsDialogOpen(false)}
                >
                  Close
                </Button>
                {selectedProperty.status === "pending" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleFlagProperty(selectedProperty.id);
                        setDetailsDialogOpen(false);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Flag Property
                    </Button>
                    <Button
                      onClick={() => {
                        handleApproveClick(selectedProperty);
                        setDetailsDialogOpen(false);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Property
                    </Button>
                  </>
                )}
                {selectedProperty.status === "flagged" && (
                  <Button
                    onClick={() => {
                      handleApproveClick(selectedProperty);
                      setDetailsDialogOpen(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Property
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Utility Amount Dialog */}
      <Dialog open={utilityDialogOpen} onOpenChange={setUtilityDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Utility Amount</DialogTitle>
            <DialogDescription>
              Please set the utility amount for this property before approving.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="utility-amount">Utility Amount (£)</Label>
              <Input
                id="utility-amount"
                type="number"
                step="0.01"
                min="0"
                value={utilityAmount}
                onChange={(e) => setUtilityAmount(e.target.value)}
                placeholder="Enter utility amount"
              />
            </div>

            {propertyToApprove && (
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm font-medium">{propertyToApprove.name}</div>
                <div className="text-xs text-muted-foreground">{propertyToApprove.address}</div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setUtilityDialogOpen(false);
                  setPropertyToApprove(null);
                  setUtilityAmount("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmApproval}
                className="bg-green-600 hover:bg-green-700"
                disabled={!utilityAmount || isNaN(parseFloat(utilityAmount))}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Property
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  Search,
  Plus,
  Edit,
  Eye,
  MoreHorizontal,
  Mail,
  Phone,
  Building,
  Percent,
  UserPlus,
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
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Axios from "@/config/axios.config";

interface Landlord {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  profile: {
    phone: string;
    status: string;
    company_name?: string;
    address?: string;
    bank_account_number?: string;
    sort_code?: string;
    commission_rate?: number;
    preferred_contact_method?: "email" | "phone";
    notes?: string;
    created_by_agent?: number;
  };
  relationship_id?: number;
  created_at?: string;
  properties_count: number;
}

interface LandlordManagementData {
  agent_created: Landlord[];
  existing: Landlord[];
  total: number;
}

interface CreateLandlordData {
  user: {
    email: string;
    first_name: string;
    last_name: string;
  };
  profile: {
    phone: string;
    company_name?: string;
    address?: string;
    bank_account_number?: string;
    sort_code?: string;
    commission_rate?: number;
    preferred_contact_method?: "email" | "phone";
    notes?: string;
  };
}

export default function AgentLandlordManagement() {
  const { data: session } = useSession();
  const [landlords, setLandlords] = useState<LandlordManagementData>({
    agent_created: [],
    existing: [],
    total: 0,
  });
  const [availableLandlords, setAvailableLandlords] = useState<Landlord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLandlord, setSelectedLandlord] = useState<Landlord | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("my-landlords");

  const [createData, setCreateData] = useState<CreateLandlordData>({
    user: {
      email: "",
      first_name: "",
      last_name: "",
    },
    profile: {
      phone: "",
      company_name: "",
      address: "",
      bank_account_number: "",
      sort_code: "",
      commission_rate: undefined,
      preferred_contact_method: "email",
      notes: "",
    },
  });

  // Fetch agent's landlords
  const fetchMyLandlords = async () => {
    try {
      setIsLoading(true);
      const response = await Axios.get("/users/agent/landlord-management/my-landlords/", {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
      });

      if (response.data?.status === "success") {
        setLandlords(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching landlords:", error);
      toast.error("Failed to fetch landlords");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available landlords for connection
  const fetchAvailableLandlords = async () => {
    try {
      const response = await Axios.get("/users/agent/landlord-management/available-landlords/", {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
      });

      if (response.data?.status === "success") {
        setAvailableLandlords(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching available landlords:", error);
      toast.error("Failed to fetch available landlords");
    }
  };

  // Create new landlord
  const handleCreateLandlord = async () => {
    try {
      const response = await Axios.post(
        "/users/agent/landlord-management/create-landlord/",
        createData,
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        }
      );

      if (response.data?.status === "success") {
        toast.success("Landlord created successfully");
        setIsCreateDialogOpen(false);
        setCreateData({
          user: { email: "", first_name: "", last_name: "" },
          profile: {
            phone: "",
            company_name: "",
            address: "",
            bank_account_number: "",
            sort_code: "",
            commission_rate: undefined,
            preferred_contact_method: "email",
            notes: "",
          },
        });
        fetchMyLandlords();
        
        // Show generated password
        if (response.data.data.generated_password) {
          toast.info(`Generated password: ${response.data.data.generated_password}`, {
            duration: 10000,
          });
        }
      }
    } catch (error: any) {
      if (error?.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors.user)
          .flat()
          .join(" ");
        toast.error(errorMessages || "Failed to create landlord");
      } else {
        toast.error(error?.response?.data?.message || "Failed to create landlord");
      }
    }
  };

  // Connect to existing landlord
  const handleConnectLandlord = async (landlordId: number) => {
    try {
      const response = await Axios.post(
        "/users/agent/relationships/",
        { landlord_id: landlordId },
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        }
      );

      if (response.data?.status === "success") {
        toast.success("Successfully connected to landlord");
        fetchMyLandlords();
        fetchAvailableLandlords();
        setIsConnectDialogOpen(false);
      }
    } catch (error: any) {
      console.error("Error connecting to landlord:", error);
      toast.error(error?.response?.data?.message || "Failed to connect to landlord");
    }
  };

  // Update landlord (only for agent-created)
  const handleUpdateLandlord = async () => {
    if (!selectedLandlord) return;

    try {
      const updateData = {
        user: {
          email: selectedLandlord.email,
          first_name: selectedLandlord.first_name,
          last_name: selectedLandlord.last_name,
        },
        profile: {
          phone: selectedLandlord.profile.phone,
          company_name: selectedLandlord.profile.company_name,
          address: selectedLandlord.profile.address,
          bank_account_number: selectedLandlord.profile.bank_account_number,
          sort_code: selectedLandlord.profile.sort_code,
          commission_rate: selectedLandlord.profile.commission_rate,
          preferred_contact_method: selectedLandlord.profile.preferred_contact_method,
          notes: selectedLandlord.profile.notes,
        },
      };

      const response = await Axios.put(
        `/users/agent/landlord-management/update-landlord/${selectedLandlord.id}/`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        }
      );

      if (response.data?.status === "success") {
        toast.success("Landlord updated successfully");
        setIsEditDialogOpen(false);
        fetchMyLandlords();
      }
    } catch (error: any) {
      console.error("Error updating landlord:", error);
      toast.error(error?.response?.data?.message || "Failed to update landlord");
    }
  };

  useEffect(() => {
    if (session?.access && session?.role === "agent") {
      fetchMyLandlords();
      fetchAvailableLandlords();
    }
  }, [session]);

  // Filter landlords based on search
  const getFilteredLandlords = (landlordList: Landlord[]) => {
    return landlordList.filter((landlord) =>
      `${landlord.first_name} ${landlord.last_name} ${landlord.email} ${landlord.profile.company_name || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  };

  if (!session || session.role !== "agent") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Access denied. Agent role required.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Landlord Management</h1>
        <p className="text-gray-600">
          Manage your landlord connections. Create new landlords or connect to existing ones.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Landlords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{landlords.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Agent Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{landlords.agent_created.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Connected Existing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{landlords.existing.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-landlords">My Landlords</TabsTrigger>
          <TabsTrigger value="connect-existing">Connect to Existing</TabsTrigger>
        </TabsList>

        {/* My Landlords Tab */}
        <TabsContent value="my-landlords" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search landlords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Landlord
            </Button>
          </div>

          {/* Agent Created Landlords */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Landlords I Created</h3>
            <LandlordTable
              landlords={getFilteredLandlords(landlords.agent_created)}
              onView={(landlord) => {
                setSelectedLandlord(landlord);
                setIsViewDialogOpen(true);
              }}
              onEdit={(landlord) => {
                setSelectedLandlord(landlord);
                setIsEditDialogOpen(true);
              }}
              showEditAction={true}
            />
          </div>

          {/* Existing Connected Landlords */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Connected Existing Landlords</h3>
            <LandlordTable
              landlords={getFilteredLandlords(landlords.existing)}
              onView={(landlord) => {
                setSelectedLandlord(landlord);
                setIsViewDialogOpen(true);
              }}
              showEditAction={false}
            />
          </div>
        </TabsContent>

        {/* Connect to Existing Tab */}
        <TabsContent value="connect-existing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Landlords</CardTitle>
              <CardDescription>
                Connect to existing landlords who are open for agent management
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableLandlords.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Available Landlords
                  </h3>
                  <p className="text-gray-600">
                    All available landlords are currently connected or not accepting agents.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableLandlords.map((landlord) => (
                    <div
                      key={landlord.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {landlord.first_name?.[0]}{landlord.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {landlord.first_name} {landlord.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{landlord.email}</div>
                          <div className="text-sm text-gray-500">
                            {landlord.properties_count} properties
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => handleConnectLandlord(landlord.id)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Landlord Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Landlord</DialogTitle>
            <DialogDescription>
              Create a new landlord account that will be automatically connected to you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={createData.user.first_name}
                    onChange={(e) =>
                      setCreateData({
                        ...createData,
                        user: { ...createData.user, first_name: e.target.value },
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={createData.user.last_name}
                    onChange={(e) =>
                      setCreateData({
                        ...createData,
                        user: { ...createData.user, last_name: e.target.value },
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={createData.user.email}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      user: { ...createData.user, email: e.target.value },
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={createData.profile.phone}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      profile: { ...createData.profile, phone: e.target.value },
                    })
                  }
                  required
                />
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business Information</h3>
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={createData.profile.company_name}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      profile: { ...createData.profile, company_name: e.target.value },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={createData.profile.address}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      profile: { ...createData.profile, address: e.target.value },
                    })
                  }
                />
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Financial Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_account_number">Bank Account Number</Label>
                  <Input
                    id="bank_account_number"
                    value={createData.profile.bank_account_number}
                    onChange={(e) =>
                      setCreateData({
                        ...createData,
                        profile: { ...createData.profile, bank_account_number: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="sort_code">Sort Code</Label>
                  <Input
                    id="sort_code"
                    value={createData.profile.sort_code}
                    onChange={(e) =>
                      setCreateData({
                        ...createData,
                        profile: { ...createData.profile, sort_code: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={createData.profile.commission_rate || ""}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      profile: {
                        ...createData.profile,
                        commission_rate: e.target.value ? parseFloat(e.target.value) : undefined,
                      },
                    })
                  }
                />
              </div>
            </div>

            {/* Contact Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Preferences</h3>
              <div>
                <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
                <Select
                  value={createData.profile.preferred_contact_method}
                  onValueChange={(value: "email" | "phone") =>
                    setCreateData({
                      ...createData,
                      profile: { ...createData.profile, preferred_contact_method: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={createData.profile.notes}
                  onChange={(e) =>
                    setCreateData({
                      ...createData,
                      profile: { ...createData.profile, notes: e.target.value },
                    })
                  }
                  placeholder="Any additional notes about this landlord..."
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLandlord}>Create Landlord</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Landlord Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Landlord</DialogTitle>
            <DialogDescription>
              Update landlord information (only for landlords you created).
            </DialogDescription>
          </DialogHeader>
          
          {selectedLandlord && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_first_name">First Name *</Label>
                    <Input
                      id="edit_first_name"
                      value={selectedLandlord.first_name}
                      onChange={(e) =>
                        setSelectedLandlord({
                          ...selectedLandlord,
                          first_name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_last_name">Last Name *</Label>
                    <Input
                      id="edit_last_name"
                      value={selectedLandlord.last_name}
                      onChange={(e) =>
                        setSelectedLandlord({
                          ...selectedLandlord,
                          last_name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_email">Email *</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={selectedLandlord.email}
                    onChange={(e) =>
                      setSelectedLandlord({
                        ...selectedLandlord,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_phone">Phone Number *</Label>
                  <Input
                    id="edit_phone"
                    value={selectedLandlord.profile.phone}
                    onChange={(e) =>
                      setSelectedLandlord({
                        ...selectedLandlord,
                        profile: { ...selectedLandlord.profile, phone: e.target.value },
                      })
                    }
                    required
                  />
                </div>
              </div>

              {/* Business Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Business Information</h3>
                <div>
                  <Label htmlFor="edit_company_name">Company Name</Label>
                  <Input
                    id="edit_company_name"
                    value={selectedLandlord.profile.company_name || ""}
                    onChange={(e) =>
                      setSelectedLandlord({
                        ...selectedLandlord,
                        profile: { ...selectedLandlord.profile, company_name: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit_address">Address</Label>
                  <Textarea
                    id="edit_address"
                    value={selectedLandlord.profile.address || ""}
                    onChange={(e) =>
                      setSelectedLandlord({
                        ...selectedLandlord,
                        profile: { ...selectedLandlord.profile, address: e.target.value },
                      })
                    }
                  />
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Financial Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_bank_account_number">Bank Account Number</Label>
                    <Input
                      id="edit_bank_account_number"
                      value={selectedLandlord.profile.bank_account_number || ""}
                      onChange={(e) =>
                        setSelectedLandlord({
                          ...selectedLandlord,
                          profile: { ...selectedLandlord.profile, bank_account_number: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_sort_code">Sort Code</Label>
                    <Input
                      id="edit_sort_code"
                      value={selectedLandlord.profile.sort_code || ""}
                      onChange={(e) =>
                        setSelectedLandlord({
                          ...selectedLandlord,
                          profile: { ...selectedLandlord.profile, sort_code: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_commission_rate">Commission Rate (%)</Label>
                  <Input
                    id="edit_commission_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={selectedLandlord.profile.commission_rate || ""}
                    onChange={(e) =>
                      setSelectedLandlord({
                        ...selectedLandlord,
                        profile: {
                          ...selectedLandlord.profile,
                          commission_rate: e.target.value ? parseFloat(e.target.value) : undefined,
                        },
                      })
                    }
                  />
                </div>
              </div>

              {/* Contact Preferences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Preferences</h3>
                <div>
                  <Label htmlFor="edit_preferred_contact_method">Preferred Contact Method</Label>
                  <Select
                    value={selectedLandlord.profile.preferred_contact_method || "email"}
                    onValueChange={(value: "email" | "phone") =>
                      setSelectedLandlord({
                        ...selectedLandlord,
                        profile: { ...selectedLandlord.profile, preferred_contact_method: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_notes">Notes</Label>
                  <Textarea
                    id="edit_notes"
                    value={selectedLandlord.profile.notes || ""}
                    onChange={(e) =>
                      setSelectedLandlord({
                        ...selectedLandlord,
                        profile: { ...selectedLandlord.profile, notes: e.target.value },
                      })
                    }
                    placeholder="Any additional notes about this landlord..."
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLandlord}>Update Landlord</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Landlord Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Landlord Details</DialogTitle>
            <DialogDescription>
              View detailed information about this landlord.
            </DialogDescription>
          </DialogHeader>
          
          {selectedLandlord && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Name</Label>
                      <div className="font-medium">
                        {selectedLandlord.first_name} {selectedLandlord.last_name}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Email</Label>
                      <div className="font-medium">{selectedLandlord.email}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Phone</Label>
                      <div className="font-medium">{selectedLandlord.profile.phone}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">Properties</Label>
                      <div className="font-medium">{selectedLandlord.properties_count}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Information */}
              {(selectedLandlord.profile.company_name || selectedLandlord.profile.address) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Business Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedLandlord.profile.company_name && (
                      <div>
                        <Label className="text-sm text-gray-500">Company Name</Label>
                        <div className="font-medium">{selectedLandlord.profile.company_name}</div>
                      </div>
                    )}
                    {selectedLandlord.profile.address && (
                      <div>
                        <Label className="text-sm text-gray-500">Address</Label>
                        <div className="font-medium">{selectedLandlord.profile.address}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Financial Information */}
              {(selectedLandlord.profile.bank_account_number || 
                selectedLandlord.profile.sort_code || 
                selectedLandlord.profile.commission_rate) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Financial Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedLandlord.profile.bank_account_number && (
                        <div>
                          <Label className="text-sm text-gray-500">Bank Account</Label>
                          <div className="font-medium">{selectedLandlord.profile.bank_account_number}</div>
                        </div>
                      )}
                      {selectedLandlord.profile.sort_code && (
                        <div>
                          <Label className="text-sm text-gray-500">Sort Code</Label>
                          <div className="font-medium">{selectedLandlord.profile.sort_code}</div>
                        </div>
                      )}
                    </div>
                    {selectedLandlord.profile.commission_rate && (
                      <div>
                        <Label className="text-sm text-gray-500">Commission Rate</Label>
                        <div className="font-medium">{selectedLandlord.profile.commission_rate}%</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Contact & Notes */}
              {(selectedLandlord.profile.preferred_contact_method || selectedLandlord.profile.notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact & Notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedLandlord.profile.preferred_contact_method && (
                      <div>
                        <Label className="text-sm text-gray-500">Preferred Contact Method</Label>
                        <div className="font-medium capitalize">
                          {selectedLandlord.profile.preferred_contact_method}
                        </div>
                      </div>
                    )}
                    {selectedLandlord.profile.notes && (
                      <div>
                        <Label className="text-sm text-gray-500">Notes</Label>
                        <div className="font-medium">{selectedLandlord.profile.notes}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Relationship Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Relationship Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Created By</Label>
                      <div className="font-medium">
                        {selectedLandlord.profile.created_by_agent ? "You (Agent)" : "Existing Landlord"}
                      </div>
                    </div>
                    {selectedLandlord.created_at && (
                      <div>
                        <Label className="text-sm text-gray-500">Connected On</Label>
                        <div className="font-medium">
                          {new Date(selectedLandlord.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Landlord Table Component
function LandlordTable({
  landlords,
  onView,
  onEdit,
  showEditAction = false,
}: {
  landlords: Landlord[];
  onView: (landlord: Landlord) => void;
  onEdit?: (landlord: Landlord) => void;
  showEditAction?: boolean;
}) {
  if (landlords.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No landlords found</h3>
          <p className="text-gray-600">
            No landlords match the current search criteria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Landlord</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Properties</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {landlords.map((landlord) => (
            <TableRow key={landlord.id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {landlord.first_name?.[0]}{landlord.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {landlord.first_name} {landlord.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{landlord.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {landlord.profile.phone || "N/A"}
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Mail className="h-3 w-3" />
                    {landlord.profile.preferred_contact_method || "email"}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{landlord.profile.company_name || "N/A"}</div>
                  {landlord.profile.created_by_agent && (
                    <Badge variant="secondary" className="text-xs">
                      Agent Created
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4 text-gray-400" />
                  {landlord.properties_count}
                </div>
              </TableCell>
              <TableCell>
                {landlord.profile.commission_rate ? (
                  <div className="flex items-center gap-1">
                    <Percent className="h-4 w-4 text-gray-400" />
                    {landlord.profile.commission_rate}%
                  </div>
                ) : (
                  "N/A"
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onView(landlord)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {showEditAction && onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(landlord)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
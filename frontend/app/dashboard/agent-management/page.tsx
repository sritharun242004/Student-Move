"use client";

import { useEffect, useState } from "react";
import {
  User,
  Users,
  Search,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Mail,
  Phone,
  Eye,
  Ban,
  Trash2,
  Clock,
  Filter,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import Axios from "@/config/axios.config";

interface Agent {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  date_joined?: string;
  dateJoined?: string; // CamelCase version from API
  is_active: boolean;
  profile: {
    phone: string;
    status: "active" | "inactive" | "suspended" | "binned";
  };
}

interface AgentStats {
  landlord_count: number;
  pending_requests: number;
  status: string;
  bin_info?: {
    binned_date: string;
    days_remaining: number;
    deletion_date: string;
  };
}

// Status badge component
const StatusBadge = ({ status }: { status?: string }) => {
  // Add safety check for status with explicit string conversion
  const safeStatus = String(status || 'unknown').toLowerCase();
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return { color: "bg-green-100 text-green-800", icon: CheckCircle };
      case "inactive":
        return { color: "bg-yellow-100 text-yellow-800", icon: Clock };
      case "suspended":
        return { color: "bg-red-100 text-red-800", icon: Ban };
      case "binned":
        return { color: "bg-orange-100 text-orange-800", icon: Trash2 };
      default:
        return { color: "bg-gray-100 text-gray-800", icon: AlertCircle };
    }
  };

  const config = getStatusConfig(safeStatus);
  const Icon = config.icon;

  // Safe string processing with explicit checks
  const displayStatus = safeStatus && typeof safeStatus === 'string' && safeStatus.length > 0
    ? safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)
    : 'Unknown';

  return (
    <Badge className={config.color}>
      <Icon className="w-3 h-3 mr-1" />
      {displayStatus}
    </Badge>
  );
};

export default function AgentManagement() {
  const { data: session } = useSession();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date_joined");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentTab, setCurrentTab] = useState("verification");
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Rejection dialog state
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  
  // Suspension dialog state
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  
  // Single removal dialog state
  const [removalDialogOpen, setRemovalDialogOpen] = useState(false);
  const [removalReason, setRemovalReason] = useState("");

  // Fetch agents
  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const response = await Axios.get("/users/agent/", {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
      });

      if (response.data?.status === "success") {        
        // Validate agent data structure
        const validAgents = response.data.users.filter((agent: any) => {
          if (!agent) {
            console.warn("Null agent found");
            return false;
          }
          if (!agent.profile) {
            console.warn("Agent missing profile:", agent);
            return false;
          }
          if (typeof agent.profile.status !== 'string') {
            console.warn("Agent status not string:", agent.profile.status);
            return false;
          }         
          return true;
        });
                
        // Additional validation to ensure no null/undefined values slip through
        const safeAgents = validAgents.map((agent: any) => ({
          ...agent,
          first_name: agent.first_name || "",
          last_name: agent.last_name || "",
          email: agent.email || "",
          date_joined: agent.date_joined || agent.dateJoined || null, // Handle both field names
          dateJoined: agent.dateJoined || agent.date_joined || null, // Preserve both versions
          profile: {
            ...agent.profile,
            status: agent.profile?.status || "unknown",
            phone: agent.profile?.phone || ""
          }
        }));
        
        setAgents(safeAgents);
        setFilteredAgents(safeAgents);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch agent stats
  const fetchAgentStats = async (agentId: number) => {
    try {
      const response = await Axios.get(`/users/agent/${agentId}/stats/`, {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
      });

      if (response.data?.status === "success") {
        setAgentStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching agent stats:", error);
    }
  };

  useEffect(() => {
    if (session?.access) {
      fetchAgents();
    }
  }, [session]);

  // Filter and sort agents
  useEffect(() => {
    // Skip processing if removal dialog is open to avoid potential trim errors
    if (removalDialogOpen) return;
    
    const filtered = agents.filter((agent) => {
      // Add safety checks for agent data
      if (!agent || !agent.profile) {
        console.warn('Invalid agent data:', agent);
        return false;
      }
      
      const matchesSearch =
        (agent.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agent.last_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agent.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (agent.profile?.phone || '').includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" || agent.profile?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort agents
    try {
      filtered.sort((a, b) => {
        let aValue: any, bValue: any;

        // Safety check for agents
        if (!a || !b) return 0;

        switch (sortBy) {
          case "name":
            const aFirstName = (a.first_name || "").toString();
            const aLastName = (a.last_name || "").toString();
            const bFirstName = (b.first_name || "").toString();
            const bLastName = (b.last_name || "").toString();
            aValue = `${aFirstName} ${aLastName}`.trim();
            bValue = `${bFirstName} ${bLastName}`.trim();
            break;
          case "email":
            aValue = (a.email || "").toString();
            bValue = (b.email || "").toString();
            break;
          case "status":
            aValue = (a.profile?.status || "").toString();
            bValue = (b.profile?.status || "").toString();
            break;
          case "date_joined":
          default:
            const aDateValue = a.date_joined || a.dateJoined || 0;
            const bDateValue = b.date_joined || b.dateJoined || 0;
            aValue = new Date(aDateValue);
            bValue = new Date(bDateValue);
            break;
        }

        if (sortBy === "date_joined") {
          const aDate = aValue instanceof Date ? aValue : new Date(aValue);
          const bDate = bValue instanceof Date ? bValue : new Date(bValue);
          return sortOrder === "asc"
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }

        // Ensure we have strings before comparison
        const aStr = (aValue || "").toString();
        const bStr = (bValue || "").toString();

        if (sortOrder === "asc") {
          return aStr > bStr ? 1 : -1;
        } else {
          return aStr < bStr ? 1 : -1;
        }
      });
    } catch (error) {
      console.error("Error in sorting agents:", error);
      // If sorting fails, just use the filtered array without sorting
    }

    setFilteredAgents(filtered);
  }, [agents, searchTerm, statusFilter, sortBy, sortOrder, removalDialogOpen]);

  // Handle agent selection
  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDetailsDialogOpen(true);
    fetchAgentStats(agent.id);
  };

  // Handle agent approval
  const handleApproveAgent = async (agentId: number) => {
    try {
      await Axios.patch(
        `/users/approve/${agentId}/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        }
      );
      fetchAgents();
      setIsDetailsDialogOpen(false);
    } catch (error) {
      console.error("Error approving agent:", error);
    }
  };

  // Handle agent rejection
  const handleRejectAgent = async () => {
    if (!selectedAgent) return;

    try {
      await Axios.patch(
        `/users/suspend/${selectedAgent.id}/`,
        { reason: rejectionReason },
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        }
      );
      fetchAgents();
      setIsDetailsDialogOpen(false);
      setRejectDialogOpen(false);
      setRejectionReason("");
    } catch (error) {
      console.error("Error rejecting agent:", error);
    }
  };

  // Handle agent suspension
  const handleSuspendAgent = async () => {
    if (!selectedAgent) return;

    try {
      await Axios.patch(
        `/users/suspend/${selectedAgent.id}/`,
        { reason: suspensionReason },
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        }
      );
      fetchAgents();
      setIsDetailsDialogOpen(false);
      setSuspendDialogOpen(false);
      setSuspensionReason("");
    } catch (error) {
      console.error("Error suspending agent:", error);
    }
  };

  // Handle agent reactivation
  const handleReactivateAgent = async (agentId: number) => {
    try {
      await Axios.patch(
        `/users/approve/${agentId}/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        }
      );
      fetchAgents();
      setIsDetailsDialogOpen(false);
    } catch (error) {
      console.error("Error reactivating agent:", error);
    }
  };

  // Handle agent removal
  const handleRemoveAgent = async () => {
    
    if (!selectedAgent) {
      return;
    }

    try {
      // Ensure removalReason is a string
      const reason = (removalReason || "").toString().trim();
      
      await Axios.delete(`/users/agent/${selectedAgent.id}/remove/`, {
        headers: {
          Authorization: `Bearer ${session?.access}`,
        },
        data: { reason },
      });
      
      console.log("Remove request successful, updating state");
      
      // Reset states first to prevent any re-render issues
      setRemovalDialogOpen(false);
      setRemovalReason("");
      setIsDetailsDialogOpen(false);
      
      // Then fetch updated data
      await fetchAgents();
    } catch (error) {
      console.error("Error removing agent:", error);
      // Reset dialog state even on error
      setRemovalDialogOpen(false);
    }
  };

  // Handle agent restoration
  const handleRestoreAgent = async (agentId: number) => {
    try {
      await Axios.patch(
        `/users/agent/${agentId}/restore/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${session?.access}`,
          },
        }
      );
      fetchAgents();
      setIsDetailsDialogOpen(false);
    } catch (error) {
      console.error("Error restoring agent:", error);
    }
  };

  // Get stats for dashboard
  const getStatsForTab = (tab: string) => {
    switch (tab) {
      case "verification":
        return agents.filter((agent) => agent.profile.status === "inactive");
      case "active":
        return agents.filter((agent) => agent.profile.status === "active");
      case "suspended":
        return agents.filter((agent) => agent.profile.status === "suspended");
      case "binned":
        return agents.filter((agent) => agent.profile.status === "binned");
      default:
        return agents;
    }
  };

  if (session?.profile?.status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Agent Management</h1>
        <p className="text-gray-600">
          Manage and verify agent accounts, monitor their landlord relationships, and oversee agent activities.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter((a) => a.profile.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter((a) => a.profile.status === "inactive").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Suspended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter((a) => a.profile.status === "suspended").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="verification" className="relative">
            Verification Queue
            {agents.filter((a) => a.profile.status === "inactive").length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 p-0 text-xs text-white">
                {agents.filter((a) => a.profile.status === "inactive").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">Active Agents</TabsTrigger>
          <TabsTrigger value="suspended">Suspended</TabsTrigger>
          <TabsTrigger value="binned">Binned</TabsTrigger>
          <TabsTrigger value="all">All Agents</TabsTrigger>
        </TabsList>

        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 my-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search agents by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="binned">Binned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_joined">Date Joined</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>
        </div>

        {/* Tab Contents */}
        <TabsContent value="verification" className="space-y-4">
          <AgentTable
            agents={getStatsForTab("verification")}
            onAgentClick={handleAgentClick}
          />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <AgentTable
            agents={getStatsForTab("active")}
            onAgentClick={handleAgentClick}
          />
        </TabsContent>

        <TabsContent value="suspended" className="space-y-4">
          <AgentTable
            agents={getStatsForTab("suspended")}
            onAgentClick={handleAgentClick}
          />
        </TabsContent>

        <TabsContent value="binned" className="space-y-4">
          <AgentTable
            agents={getStatsForTab("binned")}
            onAgentClick={handleAgentClick}
          />
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <AgentTable agents={filteredAgents} onAgentClick={handleAgentClick} />
        </TabsContent>
      </Tabs>

      {/* Agent Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedAgent && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl">Agent Details</DialogTitle>
                <DialogDescription>
                  Detailed information about {selectedAgent.first_name || ''}{" "}
                  {selectedAgent.last_name || ''}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-lg">
                          {selectedAgent.first_name?.[0] || ''}
                          {selectedAgent.last_name?.[0] || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {selectedAgent.first_name || ''} {selectedAgent.last_name || ''}
                        </h3>
                        <StatusBadge status={selectedAgent.profile?.status} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{selectedAgent.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{selectedAgent.profile?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span>
                          Joined: {(() => {
                            const dateValue = selectedAgent.date_joined || selectedAgent.dateJoined;
                            if (!dateValue) return 'Not Available';
                            
                            try {
                              const date = new Date(dateValue);
                              return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                            } catch (error) {
                              console.error('Error formatting date:', dateValue, error);
                              return 'Invalid Date';
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Agent Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {agentStats ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">
                              {agentStats.landlord_count}
                            </div>
                            <div className="text-sm text-gray-600">
                              Approved Landlords
                            </div>
                          </div>
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">
                              {agentStats.pending_requests}
                            </div>
                            <div className="text-sm text-gray-600">
                              Pending Requests
                            </div>
                          </div>
                        </div>

                        {agentStats.bin_info && (
                          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <h4 className="font-semibold text-orange-800 mb-2">
                              Bin Status Information
                            </h4>
                            <div className="text-sm text-orange-700 space-y-1">
                              <div>
                                Binned on:{" "}
                                {new Date(agentStats.bin_info.binned_date).toLocaleDateString()}
                              </div>
                              <div>
                                Days remaining: {agentStats.bin_info.days_remaining}
                              </div>
                              <div>
                                Deletion date:{" "}
                                {new Date(agentStats.bin_info.deletion_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="text-gray-500">Loading statistics...</div>
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
                          selectedAgent.profile?.status === "active"
                            ? "bg-green-100"
                            : selectedAgent.profile?.status === "inactive"
                            ? "bg-yellow-100"
                            : selectedAgent.profile?.status === "suspended"
                            ? "bg-red-100"
                            : selectedAgent.profile?.status === "binned"
                            ? "bg-orange-100"
                            : "bg-gray-100"
                        }`}
                      >
                        {selectedAgent.profile?.status === "active" && (
                          <CheckCircle className="h-8 w-8 text-green-600" />
                        )}
                        {selectedAgent.profile?.status === "inactive" && (
                          <Clock className="h-8 w-8 text-yellow-600" />
                        )}
                        {selectedAgent.profile?.status === "suspended" && (
                          <Ban className="h-8 w-8 text-red-600" />
                        )}
                        {selectedAgent.profile?.status === "binned" && (
                          <Trash2 className="h-8 w-8 text-orange-600" />
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-1">
                        {selectedAgent.profile?.status 
                          ? selectedAgent.profile.status.charAt(0).toUpperCase() + selectedAgent.profile.status.slice(1)
                          : 'Unknown Status'}
                      </h3>
                      <p className="text-sm text-muted-foreground text-center mb-6">
                        {selectedAgent.profile?.status === "active" &&
                          "This agent has been verified and can manage landlord accounts."}
                        {selectedAgent.profile?.status === "inactive" &&
                          "This agent is awaiting verification."}
                        {selectedAgent.profile?.status === "suspended" &&
                          "This agent's account has been suspended."}
                        {selectedAgent.profile?.status === "binned" &&
                          "This agent's account has been temporarily removed and can be restored."}
                      </p>

                      {selectedAgent.profile?.status === "inactive" && (
                        <div className="flex gap-2 w-full">
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleApproveAgent(selectedAgent.id)}
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

                      {selectedAgent.profile?.status === "active" && (
                        <div className="flex gap-2 w-full">
                          <Button
                            variant="outline"
                            className="flex-1 text-purple-600 border-purple-200 hover:bg-purple-50"
                            onClick={() => setSuspendDialogOpen(true)}
                          >
                            <Ban className="mr-1.5 h-4 w-4" />
                            Suspend Account
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => setRemovalDialogOpen(true)}
                          >
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            Remove Agent
                          </Button>
                        </div>
                      )}

                      {selectedAgent.profile?.status === "suspended" && (
                        <div className="flex gap-2 w-full">
                          <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => handleReactivateAgent(selectedAgent.id)}
                          >
                            <CheckCircle className="mr-1.5 h-4 w-4" />
                            Reactivate Account
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => setRemovalDialogOpen(true)}
                          >
                            <Trash2 className="mr-1.5 h-4 w-4" />
                            Remove Agent
                          </Button>
                        </div>
                      )}

                      {selectedAgent.profile?.status === "binned" && (
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleRestoreAgent(selectedAgent.id)}
                        >
                          <RotateCcw className="mr-1.5 h-4 w-4" />
                          Restore Account
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Agent</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this agent application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectAgent}>
              Reject Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspension Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Agent</DialogTitle>
            <DialogDescription>
              Please provide a reason for suspending this agent account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="suspensionReason">Suspension Reason</Label>
              <Textarea
                id="suspensionReason"
                placeholder="Enter reason for suspension..."
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspendAgent}>
              Suspend Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Removal Dialog */}
      {removalDialogOpen && (
        <AlertDialog open={removalDialogOpen} onOpenChange={setRemovalDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Agent</AlertDialogTitle>
                    <p>
                  Are you sure you want to remove this agent? This action will:
                </p>

                <div className="ml-4 space-y-1 text-sm">
                  <div className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Move the agent to bin status for 7 days</span>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Disable their access to all landlord accounts</span>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Send them a notification about the removal</span>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Permanently delete their account after 7 days</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="removalReason">Removal Reason (Optional)</Label>
                  <Textarea
                    id="removalReason"
                    placeholder="Enter reason for removal..."
                    value={String(removalReason || "")}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (typeof value === 'string') {
                        setRemovalReason(value);
                      } else {
                        setRemovalReason("");
                      }
                    }}
                    className="mt-2"
                  />
                </div>
                
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveAgent}
                className="bg-red-600 hover:bg-red-700"
              >
                Remove Agent
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

// Agent Table Component
function AgentTable({
  agents,
  onAgentClick,
}: {
  agents: Agent[];
  onAgentClick: (agent: Agent) => void;
}) {
  if (agents.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
          <p className="text-gray-600">
            No agents match the current filters or search criteria.
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
            <TableHead>Agent</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow
              key={agent.id}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => onAgentClick(agent)}
            >
              <TableCell className="font-medium">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      {agent.first_name?.[0] || ''}
                      {agent.last_name?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {agent.first_name || ''} {agent.last_name || ''}
                    </div>
                    <div className="text-sm text-gray-500">{agent.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{agent.profile?.phone || 'N/A'}</div>
                  <div className="text-gray-500">{agent.email || 'N/A'}</div>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={agent.profile?.status} />
              </TableCell>
              <TableCell>
                {(() => {
                  const dateValue = agent.date_joined || agent.dateJoined;
                  if (!dateValue) return 'Not Available';
                  
                  try {
                    const date = new Date(dateValue);
                    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
                  } catch (error) {
                    console.error('Error formatting date:', dateValue, error);
                    return 'Invalid Date';
                  }
                })()}
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
                    <DropdownMenuItem onClick={() => onAgentClick(agent)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
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

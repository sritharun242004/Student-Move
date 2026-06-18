"use client";

import { useState } from "react";
import {
  Users,
  User,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Home,
  Calendar,
  Ban,
  Trash2,
  MessageSquare,
  CheckCircle,
  XCircle,
  FileText,
  ArrowRight,
  Download,
  History,
  UserCog,
  Scale,
  Eye,
  RefreshCw,
  ExternalLink,
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
import { Progress } from "@/components/ui/progress";
import {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineHeader,
  TimelineIcon,
  TimelineTitle,
  TimelineBody,
  TimelineContent,
} from "@/components/ui/timeline";

// Mock data for tenants
const tenants = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "+44 7123 456789",
    property: "St. Chads Drive, Headingley",
    unit: "Apartment 1A",
    leaseStart: "2024-09-01",
    leaseEnd: "2025-08-31",
    rentAmount: 595,
    status: "Active",
    joinDate: "2024-08-15",
    documents: ["Lease Agreement", "ID Verification", "Guarantor Form"],
    notes: "Student at Leeds University. Parents are guarantors.",
    avatar: "/placeholder.svg?height=40&width=40",
    paymentHistory: [
      { id: 1, date: "2025-03-01", amount: 595, status: "Paid" },
      { id: 2, date: "2025-02-01", amount: 595, status: "Paid" },
      { id: 3, date: "2025-01-01", amount: 595, status: "Paid" },
    ],
    maintenanceRequests: [
      {
        id: 1,
        date: "2025-02-15",
        issue: "Leaking faucet in bathroom",
        status: "Completed",
      },
    ],
    disputes: [],
  },
  {
    id: 2,
    name: "Emma Johnson",
    email: "emma.johnson@example.com",
    phone: "+44 7234 567890",
    property: "Queens Road, Hyde Park",
    unit: "Apartment 2B",
    leaseStart: "2024-09-01",
    leaseEnd: "2025-08-31",
    rentAmount: 625,
    status: "Active",
    joinDate: "2024-08-20",
    documents: ["Lease Agreement", "ID Verification"],
    notes: "Student at Leeds Beckett. Works part-time at local cafe.",
    avatar: "/placeholder.svg?height=40&width=40",
    paymentHistory: [
      { id: 1, date: "2025-03-01", amount: 625, status: "Paid" },
      { id: 2, date: "2025-02-01", amount: 625, status: "Paid" },
      { id: 3, date: "2025-01-01", amount: 625, status: "Paid" },
    ],
    maintenanceRequests: [
      {
        id: 1,
        date: "2025-03-10",
        issue: "Heating not working",
        status: "In Progress",
      },
    ],
    disputes: [],
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "michael.brown@example.com",
    phone: "+44 7345 678901",
    property: "Belle Vue Road, Hyde Park",
    unit: "Room 3",
    leaseStart: "2024-09-01",
    leaseEnd: "2025-08-31",
    rentAmount: 550,
    status: "Active",
    joinDate: "2024-08-10",
    documents: ["Lease Agreement", "ID Verification", "Guarantor Form"],
    notes: "PhD student at University of Leeds.",
    avatar: "/placeholder.svg?height=40&width=40",
    paymentHistory: [
      { id: 1, date: "2025-03-01", amount: 550, status: "Paid" },
      { id: 2, date: "2025-02-01", amount: 550, status: "Paid" },
      { id: 3, date: "2025-01-01", amount: 550, status: "Paid" },
    ],
    maintenanceRequests: [
      {
        id: 1,
        date: "2025-03-05",
        issue: "Broken window in bedroom",
        status: "In Progress",
      },
    ],
    disputes: [],
  },
  {
    id: 4,
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    phone: "+44 7456 789012",
    property: "St. Chads Drive, Headingley",
    unit: "Apartment 2C",
    leaseStart: "2024-09-01",
    leaseEnd: "2025-08-31",
    rentAmount: 595,
    status: "Active",
    joinDate: "2024-08-25",
    documents: ["Lease Agreement", "ID Verification"],
    notes: "Third year student at Leeds Arts University.",
    avatar: "/placeholder.svg?height=40&width=40",
    paymentHistory: [
      { id: 1, date: "2025-03-01", amount: 595, status: "Paid" },
      { id: 2, date: "2025-02-01", amount: 595, status: "Paid" },
      { id: 3, date: "2025-01-01", amount: 595, status: "Paid" },
    ],
    maintenanceRequests: [
      {
        id: 1,
        date: "2025-02-20",
        issue: "Light fixture not working in kitchen",
        status: "Completed",
      },
    ],
    disputes: [],
  },
  {
    id: 5,
    name: "David Taylor",
    email: "david.taylor@example.com",
    phone: "+44 7567 890123",
    property: "Queens Road, Hyde Park",
    unit: "Apartment 1C",
    leaseStart: "2023-09-01",
    leaseEnd: "2024-08-31",
    rentAmount: 610,
    status: "Suspended",
    joinDate: "2023-08-15",
    documents: ["Lease Agreement", "ID Verification", "Guarantor Form"],
    notes:
      "Account suspended due to multiple late payments and noise complaints.",
    avatar: "/placeholder.svg?height=40&width=40",
    paymentHistory: [
      { id: 1, date: "2025-03-01", amount: 610, status: "Late" },
      { id: 2, date: "2025-02-01", amount: 610, status: "Late" },
      { id: 3, date: "2025-01-01", amount: 610, status: "Paid" },
    ],
    maintenanceRequests: [
      {
        id: 1,
        date: "2025-01-15",
        issue: "Mold in bathroom ceiling",
        status: "Completed",
      },
    ],
    disputes: [
      {
        id: 1,
        date: "2025-02-10",
        type: "Noise Complaint",
        status: "Resolved",
        description: "Landlord reported excessive noise during late hours",
        resolution: "Tenant agreed to adhere to quiet hours after 10pm",
      },
    ],
  },
];

// Mock data for disputes
const disputes = [
  {
    id: 1,
    tenant: {
      id: 5,
      name: "David Taylor",
      email: "david.taylor@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    landlord: {
      id: 2,
      name: "Sarah Thompson",
      email: "sarah.thompson@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    property: "Queens Road, Hyde Park, Apartment 1C",
    type: "Noise Complaint",
    status: "Resolved",
    priority: "Medium",
    dateOpened: "2025-02-10",
    dateClosed: "2025-02-15",
    description:
      "Landlord reported excessive noise during late hours affecting other tenants in the building.",
    resolution:
      "Tenant agreed to adhere to quiet hours after 10pm. A warning has been issued.",
    messages: [
      {
        id: 1,
        sender: "Landlord",
        name: "Sarah Thompson",
        date: "2025-02-10T10:30:00",
        content:
          "I've received multiple complaints from other tenants about loud music and noise coming from your apartment after midnight. This is a violation of the lease agreement which specifies quiet hours after 10pm.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 2,
        sender: "Tenant",
        name: "David Taylor",
        date: "2025-02-10T14:15:00",
        content:
          "I apologize for the disturbance. I had some friends over and didn't realize how late it had gotten. This won't happen again.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 3,
        sender: "Admin",
        name: "Admin",
        date: "2025-02-15T09:45:00",
        content:
          "After reviewing the complaint, we've issued a warning to the tenant. The tenant has agreed to respect quiet hours. This dispute is now considered resolved, but will remain on record.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ],
  },
  {
    id: 2,
    tenant: {
      id: 6,
      name: "Jennifer Smith",
      email: "jennifer.smith@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    landlord: {
      id: 3,
      name: "Robert Johnson",
      email: "robert.johnson@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    property: "Belle Vue Road, Hyde Park, Room 5",
    type: "Maintenance Issue",
    status: "Open",
    priority: "High",
    dateOpened: "2025-03-05",
    dateClosed: null,
    description:
      "Tenant reports persistent heating issues that have not been addressed despite multiple maintenance requests.",
    resolution: null,
    messages: [
      {
        id: 1,
        sender: "Tenant",
        name: "Jennifer Smith",
        date: "2025-03-05T09:15:00",
        content:
          "I've submitted three maintenance requests over the past month regarding the heating in my apartment. It's still not working properly and the temperature drops below 15°C at night. This is unacceptable living conditions, especially during winter.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 2,
        sender: "Landlord",
        name: "Robert Johnson",
        date: "2025-03-05T11:30:00",
        content:
          "We've sent a maintenance worker twice already. The issue seems to be with the building's central heating system which requires parts that are on order. We're doing our best to expedite this.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 3,
        sender: "Tenant",
        name: "Jennifer Smith",
        date: "2025-03-05T13:45:00",
        content:
          "This has been going on for too long. I need a concrete timeline for when this will be fixed or alternative accommodation. I'm filing this formal dispute to get this resolved immediately.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 4,
        sender: "Admin",
        name: "Admin",
        date: "2025-03-06T10:00:00",
        content:
          "We're reviewing this dispute. In the meantime, we've requested the landlord to provide a temporary heating solution or alternative accommodation until the central heating is fixed.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ],
  },
  {
    id: 3,
    tenant: {
      id: 7,
      name: "Thomas Wilson",
      email: "thomas.wilson@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    landlord: {
      id: 1,
      name: "James Wilson",
      email: "james.wilson@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    property: "St. Chads Drive, Headingley, Apartment 3B",
    type: "Security Deposit",
    status: "In Mediation",
    priority: "Medium",
    dateOpened: "2025-02-20",
    dateClosed: null,
    description:
      "Dispute over security deposit deductions after tenant moved out. Tenant claims deductions are excessive and unjustified.",
    resolution: null,
    messages: [
      {
        id: 1,
        sender: "Tenant",
        name: "Thomas Wilson",
        date: "2025-02-20T14:30:00",
        content:
          "I've received the security deposit return statement and I disagree with the deductions. £350 for 'general cleaning' and £200 for 'wear and tear' is excessive. I left the apartment in good condition and have photos to prove it.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 2,
        sender: "Landlord",
        name: "James Wilson",
        date: "2025-02-21T09:45:00",
        content:
          "The deductions are justified. The apartment required professional cleaning and there was damage to the kitchen countertop and bathroom fixtures beyond normal wear and tear. We have documentation from the move-out inspection.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 3,
        sender: "Admin",
        name: "Admin",
        date: "2025-02-22T11:15:00",
        content:
          "We've initiated the mediation process for this dispute. Both parties should submit their evidence (photos, inspection reports, etc.) within 5 business days. We'll schedule a mediation call once all documentation is received.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 4,
        sender: "Tenant",
        name: "Thomas Wilson",
        date: "2025-02-23T16:20:00",
        content:
          "I've uploaded my move-out photos and a copy of the move-in inspection report for comparison. The issues mentioned were already present when I moved in.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 5,
        sender: "Landlord",
        name: "James Wilson",
        date: "2025-02-24T10:30:00",
        content:
          "I've submitted the move-out inspection report, cleaning invoice, and repair estimates. The damage was not present during move-in.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ],
  },
  {
    id: 4,
    tenant: {
      id: 8,
      name: "Emily Davis",
      email: "emily.davis@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    landlord: {
      id: 4,
      name: "Michael Brown",
      email: "michael.brown@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    property: "Queens Road, Hyde Park, Apartment 4A",
    type: "Lease Violation",
    status: "Resolved",
    priority: "High",
    dateOpened: "2025-01-15",
    dateClosed: "2025-01-25",
    description:
      "Landlord claims tenant has unauthorized pets in violation of the lease agreement.",
    resolution:
      "Tenant agreed to remove the pet within 7 days. Follow-up inspection confirmed compliance.",
    messages: [
      {
        id: 1,
        sender: "Landlord",
        name: "Michael Brown",
        date: "2025-01-15T13:20:00",
        content:
          "During a routine inspection, we discovered you have a cat in the apartment. Your lease agreement clearly states no pets are allowed. This is a violation of your lease terms.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 2,
        sender: "Tenant",
        name: "Emily Davis",
        date: "2025-01-15T15:45:00",
        content:
          "I'm taking care of my sister's cat temporarily while she's abroad. I wasn't aware this would be an issue for a short-term arrangement. The cat will be gone in two weeks when my sister returns.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 3,
        sender: "Landlord",
        name: "Michael Brown",
        date: "2025-01-16T09:30:00",
        content:
          "The lease doesn't allow for temporary pets either. I need the cat removed immediately or we'll have to take further action.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 4,
        sender: "Admin",
        name: "Admin",
        date: "2025-01-17T11:00:00",
        content:
          "After reviewing the lease agreement, we confirm that no pets are allowed. We recommend the tenant finds alternative arrangements for the cat within 7 days to avoid further lease violation consequences.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 5,
        sender: "Tenant",
        name: "Emily Davis",
        date: "2025-01-17T14:15:00",
        content:
          "I understand. I'll arrange for the cat to stay with a friend until my sister returns. It will be removed within 7 days.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 6,
        sender: "Admin",
        name: "Admin",
        date: "2025-01-25T10:30:00",
        content:
          "A follow-up inspection has confirmed the pet has been removed. This dispute is now resolved. No further action is required.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ],
  },
  {
    id: 5,
    tenant: {
      id: 9,
      name: "Robert Clark",
      email: "robert.clark@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    landlord: {
      id: 5,
      name: "Elizabeth Green",
      email: "elizabeth.green@example.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    property: "Belle Vue Road, Hyde Park, Room 7",
    type: "Rent Increase",
    status: "Open",
    priority: "Medium",
    dateOpened: "2025-03-10",
    dateClosed: null,
    description:
      "Tenant disputes mid-lease rent increase, claiming it violates the terms of the fixed-term lease agreement.",
    resolution: null,
    messages: [
      {
        id: 1,
        sender: "Tenant",
        name: "Robert Clark",
        date: "2025-03-10T09:45:00",
        content:
          "I received a notice that my rent will increase from £600 to £675 starting next month. This is in the middle of my fixed-term lease which should guarantee the rent amount for the entire term. I believe this increase is not legal.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 2,
        sender: "Landlord",
        name: "Elizabeth Green",
        date: "2025-03-10T14:30:00",
        content:
          "The lease agreement includes a clause that allows for rent adjustments with 30 days notice due to significant increases in utility costs or property taxes. We've provided the required notice.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 3,
        sender: "Tenant",
        name: "Robert Clark",
        date: "2025-03-11T10:15:00",
        content:
          "I've reviewed the lease and while there is such a clause, it requires documentation of the increased costs. No such documentation was provided with the notice. Additionally, a 12.5% increase seems excessive for utility cost adjustments.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: 4,
        sender: "Admin",
        name: "Admin",
        date: "2025-03-12T11:30:00",
        content:
          "We're reviewing this dispute. We've requested the landlord to provide documentation of the increased costs that justify the rent adjustment. We'll provide an update once we've reviewed all documentation.",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ],
  },
];

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "Active":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Active
        </Badge>
      );
    case "Suspended":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          Suspended
        </Badge>
      );
    case "Pending":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200"
        >
          Pending
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Dispute status badge component
const DisputeStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "Open":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          Open
        </Badge>
      );
    case "In Mediation":
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200"
        >
          In Mediation
        </Badge>
      );
    case "Resolved":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Resolved
        </Badge>
      );
    case "Closed":
      return (
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-700 border-gray-200"
        >
          Closed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Priority badge component
const PriorityBadge = ({ priority }: { priority: string }) => {
  switch (priority) {
    case "High":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          High
        </Badge>
      );
    case "Medium":
      return (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200"
        >
          Medium
        </Badge>
      );
    case "Low":
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

// Format date
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

export default function AdminUserManagement() {
  const [activeTab, setActiveTab] = useState("tenants");
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [disputeStatusFilter, setDisputeStatusFilter] = useState("all");
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter tenants based on search query and status filter
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.property.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      tenant.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  // Filter disputes based on search query and status filter
  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.landlord.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      disputeStatusFilter === "all" ||
      dispute.status.toLowerCase() === disputeStatusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage tenant accounts and resolve disputes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
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
            <span className="hidden sm:inline">Tenant Management</span>
            <span className="sm:hidden">Tenants</span>
          </TabsTrigger>
          <TabsTrigger value="disputes" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">Dispute Resolution</span>
            <span className="sm:hidden">Disputes</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">User Details</span>
            <span className="sm:hidden">Details</span>
          </TabsTrigger>
        </TabsList>

        {/* Tenant Management Tab */}
        <TabsContent value="tenants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Accounts</CardTitle>
              <CardDescription>
                View and manage all tenant accounts
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
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
                      <TableHead>Tenant</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Lease Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map((tenant) => (
                      <TableRow key={tenant.id}>
                        <TableCell>
                          <Checkbox />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={tenant.avatar}
                                alt={tenant.name}
                              />
                              <AvatarFallback>
                                {tenant.name.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{tenant.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {tenant.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{tenant.property}</div>
                          <div className="text-sm text-muted-foreground">
                            {tenant.unit}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(tenant.leaseStart)} -{" "}
                          {formatDate(tenant.leaseEnd)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={tenant.status} />
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
                                  setSelectedTenant(tenant);
                                  setActiveTab("details");
                                }}
                              >
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {tenant.status === "Active" ? (
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedTenant(tenant);
                                    setSuspendDialogOpen(true);
                                  }}
                                >
                                  Suspend account
                                </DropdownMenuItem>
                              ) : tenant.status === "Suspended" ? (
                                <DropdownMenuItem className="text-green-600">
                                  Reactivate account
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedTenant(tenant);
                                  setRemoveDialogOpen(true);
                                }}
                              >
                                Remove tenant
                              </DropdownMenuItem>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Account Activity</CardTitle>
                <CardDescription>
                  Latest actions and changes to tenant accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Timeline>
                  <TimelineItem>
                    <TimelineConnector />
                    <TimelineHeader>
                      <TimelineIcon className="bg-red-500" />
                      <TimelineTitle>Account Suspended</TimelineTitle>
                    </TimelineHeader>
                    <TimelineBody>
                      <TimelineContent>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">David Taylor</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            2 days ago
                          </span>
                        </div>
                        <p>
                          Account suspended due to multiple late payments and
                          noise complaints.
                        </p>
                      </TimelineContent>
                    </TimelineBody>
                  </TimelineItem>
                  <TimelineItem>
                    <TimelineConnector />
                    <TimelineHeader>
                      <TimelineIcon className="bg-green-500" />
                      <TimelineTitle>New Tenant Registered</TimelineTitle>
                    </TimelineHeader>
                    <TimelineBody>
                      <TimelineContent>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Sarah Wilson</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            5 days ago
                          </span>
                        </div>
                        <p>New tenant account created and verified.</p>
                      </TimelineContent>
                    </TimelineBody>
                  </TimelineItem>
                  <TimelineItem>
                    <TimelineConnector />
                    <TimelineHeader>
                      <TimelineIcon className="bg-blue-500" />
                      <TimelineTitle>Lease Renewed</TimelineTitle>
                    </TimelineHeader>
                    <TimelineBody>
                      <TimelineContent>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">John Smith</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            1 week ago
                          </span>
                        </div>
                        <p>Lease renewed for another 12 months.</p>
                      </TimelineContent>
                    </TimelineBody>
                  </TimelineItem>
                  <TimelineItem>
                    <TimelineHeader>
                      <TimelineIcon className="bg-yellow-500" />
                      <TimelineTitle>Account Warning Issued</TimelineTitle>
                    </TimelineHeader>
                    <TimelineBody>
                      <TimelineContent>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Michael Brown</span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            2 weeks ago
                          </span>
                        </div>
                        <p>Warning issued for late rent payment.</p>
                      </TimelineContent>
                    </TimelineBody>
                  </TimelineItem>
                </Timeline>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full">
                  View All Activity
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
                <CardDescription>
                  Overview of tenant account status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                        <span>Active Accounts</span>
                      </div>
                      <div>
                        {tenants.filter((t) => t.status === "Active").length} (
                        {Math.round(
                          (tenants.filter((t) => t.status === "Active").length /
                            tenants.length) *
                            100
                        )}
                        %)
                      </div>
                    </div>
                    <Progress
                      value={
                        (tenants.filter((t) => t.status === "Active").length /
                          tenants.length) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                        <span>Pending Accounts</span>
                      </div>
                      <div>
                        {tenants.filter((t) => t.status === "Pending").length} (
                        {Math.round(
                          (tenants.filter((t) => t.status === "Pending")
                            .length /
                            tenants.length) *
                            100
                        )}
                        %)
                      </div>
                    </div>
                    <Progress
                      value={
                        (tenants.filter((t) => t.status === "Pending").length /
                          tenants.length) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                        <span>Suspended Accounts</span>
                      </div>
                      <div>
                        {tenants.filter((t) => t.status === "Suspended").length}{" "}
                        (
                        {Math.round(
                          (tenants.filter((t) => t.status === "Suspended")
                            .length /
                            tenants.length) *
                            100
                        )}
                        %)
                      </div>
                    </div>
                    <Progress
                      value={
                        (tenants.filter((t) => t.status === "Suspended")
                          .length /
                          tenants.length) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium mb-4">Account Actions</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <UserCog className="mr-2 h-4 w-4" />
                      Bulk Account Actions
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="mr-2 h-4 w-4" />
                      Send Mass Communication
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <History className="mr-2 h-4 w-4" />
                      View Account Audit Logs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Dispute Resolution Tab */}
        <TabsContent value="disputes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dispute Management</CardTitle>
              <CardDescription>
                Resolve disputes between landlords and tenants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search disputes by tenant, landlord, or type..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select
                  value={disputeStatusFilter}
                  onValueChange={setDisputeStatusFilter}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in mediation">In Mediation</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Parties</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date Opened</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDisputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell className="font-medium">
                          #{dispute.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{dispute.tenant.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Home className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{dispute.landlord.name}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{dispute.type}</TableCell>
                        <TableCell>{formatDate(dispute.dateOpened)}</TableCell>
                        <TableCell>
                          <PriorityBadge priority={dispute.priority} />
                        </TableCell>
                        <TableCell>
                          <DisputeStatusBadge status={dispute.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setActiveTab("details");
                            }}
                          >
                            <Eye className="mr-1.5 h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Dispute Activity</CardTitle>
                <CardDescription>
                  Latest updates on active disputes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Timeline>
                  <TimelineItem>
                    <TimelineConnector />
                    <TimelineHeader>
                      <TimelineIcon className="bg-blue-500" />
                      <TimelineTitle>New Dispute Filed</TimelineTitle>
                    </TimelineHeader>
                    <TimelineBody>
                      <TimelineContent>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            Robert Clark vs. Elizabeth Green
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            2 days ago
                          </span>
                        </div>
                        <p>Dispute filed regarding mid-lease rent increase.</p>
                      </TimelineContent>
                    </TimelineBody>
                  </TimelineItem>
                  <TimelineItem>
                    <TimelineConnector />
                    <TimelineHeader>
                      <TimelineIcon className="bg-purple-500" />
                      <TimelineTitle>Mediation Started</TimelineTitle>
                    </TimelineHeader>
                    <TimelineBody>
                      <TimelineContent>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            Thomas Wilson vs. James Wilson
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            5 days ago
                          </span>
                        </div>
                        <p>
                          Mediation process initiated for security deposit
                          dispute.
                        </p>
                      </TimelineContent>
                    </TimelineBody>
                  </TimelineItem>
                  <TimelineItem>
                    <TimelineConnector />
                    <TimelineHeader>
                      <TimelineIcon className="bg-green-500" />
                      <TimelineTitle>Dispute Resolved</TimelineTitle>
                    </TimelineHeader>
                    <TimelineBody>
                      <TimelineContent>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            Emily Davis vs. Michael Brown
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            1 week ago
                          </span>
                        </div>
                        <p>
                          Lease violation dispute resolved. Tenant agreed to
                          remove unauthorized pet.
                        </p>
                      </TimelineContent>
                    </TimelineBody>
                  </TimelineItem>
                  <TimelineItem>
                    <TimelineHeader>
                      <TimelineIcon className="bg-yellow-500" />
                      <TimelineTitle>Evidence Submitted</TimelineTitle>
                    </TimelineHeader>
                    <TimelineBody>
                      <TimelineContent>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            Jennifer Smith vs. Robert Johnson
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            1 week ago
                          </span>
                        </div>
                        <p>
                          Tenant submitted evidence for maintenance issue
                          dispute.
                        </p>
                      </TimelineContent>
                    </TimelineBody>
                  </TimelineItem>
                </Timeline>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" className="w-full">
                  View All Activity
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dispute Statistics</CardTitle>
                <CardDescription>
                  Overview of dispute resolution status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
                        <span>Open Disputes</span>
                      </div>
                      <div>
                        {disputes.filter((d) => d.status === "Open").length} (
                        {Math.round(
                          (disputes.filter((d) => d.status === "Open").length /
                            disputes.length) *
                            100
                        )}
                        %)
                      </div>
                    </div>
                    <Progress
                      value={
                        (disputes.filter((d) => d.status === "Open").length /
                          disputes.length) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
                        <span>In Mediation</span>
                      </div>
                      <div>
                        {
                          disputes.filter((d) => d.status === "In Mediation")
                            .length
                        }{" "}
                        (
                        {Math.round(
                          (disputes.filter((d) => d.status === "In Mediation")
                            .length /
                            disputes.length) *
                            100
                        )}
                        %)
                      </div>
                    </div>
                    <Progress
                      value={
                        (disputes.filter((d) => d.status === "In Mediation")
                          .length /
                          disputes.length) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                        <span>Resolved Disputes</span>
                      </div>
                      <div>
                        {disputes.filter((d) => d.status === "Resolved").length}{" "}
                        (
                        {Math.round(
                          (disputes.filter((d) => d.status === "Resolved")
                            .length /
                            disputes.length) *
                            100
                        )}
                        %)
                      </div>
                    </div>
                    <Progress
                      value={
                        (disputes.filter((d) => d.status === "Resolved")
                          .length /
                          disputes.length) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-medium mb-2">Dispute Types</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Maintenance Issues</span>
                      <span>35%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Security Deposits</span>
                      <span>25%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Lease Violations</span>
                      <span>20%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Rent Increases</span>
                      <span>15%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Noise Complaints</span>
                      <span>5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Details Tab */}
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
                      <StatusBadge status={selectedTenant.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={selectedTenant.avatar}
                          alt={selectedTenant.name}
                        />
                        <AvatarFallback>
                          {selectedTenant.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-xl font-bold">
                          {selectedTenant.name}
                        </h2>
                        <p className="text-muted-foreground">
                          Joined {formatDate(selectedTenant.joinDate)}
                        </p>
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
                            <span>{selectedTenant.email}</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Phone Number
                          </h3>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedTenant.phone}</span>
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
                            <span>
                              {selectedTenant.property}, {selectedTenant.unit}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Lease Period
                          </h3>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {formatDate(selectedTenant.leaseStart)} -{" "}
                              {formatDate(selectedTenant.leaseEnd)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">
                        Notes
                      </h3>
                      <p className="text-sm">{selectedTenant.notes}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>
                      Tenant's rent payment history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTenant.paymentHistory.map((payment: any) => (
                            <TableRow key={payment.id}>
                              <TableCell>{formatDate(payment.date)}</TableCell>
                              <TableCell>£{payment.amount}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`${
                                    payment.status === "Paid"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : payment.status === "Late"
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Maintenance Requests</CardTitle>
                    <CardDescription>
                      Tenant's maintenance request history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Issue</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTenant.maintenanceRequests.map(
                            (request: any) => (
                              <TableRow key={request.id}>
                                <TableCell>
                                  {formatDate(request.date)}
                                </TableCell>
                                <TableCell>{request.issue}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={`${
                                      request.status === "Completed"
                                        ? "bg-green-50 text-green-700 border-green-200"
                                        : request.status === "In Progress"
                                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                    }`}
                                  >
                                    {request.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {selectedTenant.disputes &&
                  selectedTenant.disputes.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Dispute History</CardTitle>
                        <CardDescription>
                          Tenant's dispute history
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Resolution</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedTenant.disputes.map((dispute: any) => (
                                <TableRow key={dispute.id}>
                                  <TableCell>
                                    {formatDate(dispute.date)}
                                  </TableCell>
                                  <TableCell>{dispute.type}</TableCell>
                                  <TableCell>
                                    <DisputeStatusBadge
                                      status={dispute.status}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {dispute.resolution || "N/A"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Account Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Contact Tenant
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Documents
                      </Button>
                      {selectedTenant.status === "Active" ? (
                        <Button
                          variant="outline"
                          className="w-full justify-start text-red-600 hover:text-red-600"
                          onClick={() => setSuspendDialogOpen(true)}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Suspend Account
                        </Button>
                      ) : selectedTenant.status === "Suspended" ? (
                        <Button
                          variant="outline"
                          className="w-full justify-start text-green-600 hover:text-green-600"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Reactivate Account
                        </Button>
                      ) : null}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-red-600 hover:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Tenant
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will permanently remove{" "}
                              {selectedTenant.name} from the system. This action
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                              Remove Tenant
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>Tenant-related documents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedTenant.documents.map(
                        (doc: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <span>{doc}</span>
                            </div>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t px-6 py-4">
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View All Documents
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Notes</CardTitle>
                    <CardDescription>
                      Add administrative notes about this tenant
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Add notes about this tenant account..."
                      className="min-h-[120px]"
                      defaultValue={selectedTenant.notes}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button>Save Notes</Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          ) : selectedDispute ? (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle>Dispute Information</CardTitle>
                        <CardDescription>
                          Details about the dispute
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <DisputeStatusBadge status={selectedDispute.status} />
                        <PriorityBadge priority={selectedDispute.priority} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">
                          Dispute ID
                        </h3>
                        <p className="font-medium">#{selectedDispute.id}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">
                          Type
                        </h3>
                        <p className="font-medium">{selectedDispute.type}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">
                          Property
                        </h3>
                        <p>{selectedDispute.property}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Date Opened
                          </h3>
                          <p>{formatDate(selectedDispute.dateOpened)}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Date Closed
                          </h3>
                          <p>
                            {selectedDispute.dateClosed
                              ? formatDate(selectedDispute.dateClosed)
                              : "N/A"}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">
                          Description
                        </h3>
                        <p className="text-sm">{selectedDispute.description}</p>
                      </div>

                      {selectedDispute.resolution && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">
                            Resolution
                          </h3>
                          <p className="text-sm">
                            {selectedDispute.resolution}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Parties Involved</CardTitle>
                    <CardDescription>
                      Tenant and landlord information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar>
                            <AvatarImage
                              src={selectedDispute.tenant.avatar}
                              alt={selectedDispute.tenant.name}
                            />
                            <AvatarFallback>
                              {selectedDispute.tenant.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">Tenant</h3>
                            <p>{selectedDispute.tenant.name}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {selectedDispute.tenant.email}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                          >
                            View Tenant Profile
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar>
                            <AvatarImage
                              src={selectedDispute.landlord.avatar}
                              alt={selectedDispute.landlord.name}
                            />
                            <AvatarFallback>
                              {selectedDispute.landlord.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">Landlord</h3>
                            <p>{selectedDispute.landlord.name}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {selectedDispute.landlord.email}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                          >
                            View Landlord Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Communication History</CardTitle>
                    <CardDescription>Messages between parties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedDispute.messages.map((message: any) => (
                        <div
                          key={message.id}
                          className={`flex gap-4 ${
                            message.sender === "Admin"
                              ? "bg-muted/30 p-4 rounded-lg"
                              : ""
                          }`}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={message.avatar}
                              alt={message.name}
                            />
                            <AvatarFallback>
                              {message.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">
                                {message.name}
                              </span>
                              <Badge
                                variant="outline"
                                className={`${
                                  message.sender === "Tenant"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : message.sender === "Landlord"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-green-50 text-green-700 border-green-200"
                                }`}
                              >
                                {message.sender}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDateTime(message.date)}
                              </span>
                            </div>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setNewMessageDialogOpen(true)}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Add Admin Message
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle>Dispute Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedDispute.status === "Open" && (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Scale className="mr-2 h-4 w-4" />
                          Start Mediation
                        </Button>
                      )}
                      {(selectedDispute.status === "Open" ||
                        selectedDispute.status === "In Mediation") && (
                        <Button
                          variant="outline"
                          className="w-full justify-start text-green-600 hover:text-green-600"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Resolved
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Contact Both Parties
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Documents
                      </Button>
                      {selectedDispute.status !== "Closed" && (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Close Dispute
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dispute Timeline</CardTitle>
                    <CardDescription>
                      Key events in this dispute
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Timeline>
                      <TimelineItem>
                        <TimelineConnector />
                        <TimelineHeader>
                          <TimelineIcon className="bg-blue-500" />
                          <TimelineTitle>Dispute Opened</TimelineTitle>
                        </TimelineHeader>
                        <TimelineBody>
                          <TimelineContent>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(selectedDispute.dateOpened)}
                            </span>
                          </TimelineContent>
                        </TimelineBody>
                      </TimelineItem>

                      {selectedDispute.status === "In Mediation" && (
                        <TimelineItem>
                          <TimelineConnector />
                          <TimelineHeader>
                            <TimelineIcon className="bg-purple-500" />
                            <TimelineTitle>Mediation Started</TimelineTitle>
                          </TimelineHeader>
                          <TimelineBody>
                            <TimelineContent>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(
                                  selectedDispute.messages[2]?.date ||
                                    selectedDispute.dateOpened
                                )}
                              </span>
                            </TimelineContent>
                          </TimelineBody>
                        </TimelineItem>
                      )}

                      {selectedDispute.status === "Resolved" && (
                        <TimelineItem>
                          <TimelineConnector />
                          <TimelineHeader>
                            <TimelineIcon className="bg-green-500" />
                            <TimelineTitle>Dispute Resolved</TimelineTitle>
                          </TimelineHeader>
                          <TimelineBody>
                            <TimelineContent>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(selectedDispute.dateClosed || "")}
                              </span>
                            </TimelineContent>
                          </TimelineBody>
                        </TimelineItem>
                      )}

                      {selectedDispute.status === "Closed" && (
                        <TimelineItem>
                          <TimelineHeader>
                            <TimelineIcon className="bg-gray-500" />
                            <TimelineTitle>Dispute Closed</TimelineTitle>
                          </TimelineHeader>
                          <TimelineBody>
                            <TimelineContent>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(selectedDispute.dateClosed || "")}
                              </span>
                            </TimelineContent>
                          </TimelineBody>
                        </TimelineItem>
                      )}
                    </Timeline>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resolution Notes</CardTitle>
                    <CardDescription>
                      Add notes about the dispute resolution
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Add notes about the resolution process..."
                      className="min-h-[120px]"
                      defaultValue={selectedDispute.resolution || ""}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button>Save Notes</Button>
                  </CardFooter>
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
                  No user or dispute selected
                </h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Select a tenant from the Tenant Management tab or a dispute
                  from the Dispute Resolution tab to view details.
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("tenants")}
                  >
                    View Tenants
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("disputes")}
                  >
                    View Disputes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Suspend Account Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Suspend Tenant Account</DialogTitle>
            <DialogDescription>
              Please provide a reason for suspending this tenant's account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="suspend-reason">Suspension Reason</Label>
              <Select>
                <SelectTrigger id="suspend-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment">Payment Issues</SelectItem>
                  <SelectItem value="noise">Noise Complaints</SelectItem>
                  <SelectItem value="property">Property Damage</SelectItem>
                  <SelectItem value="lease">Lease Violations</SelectItem>
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
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="suspend-duration">Suspension Duration</Label>
              <Select>
                <SelectTrigger id="suspend-duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="indefinite">
                    Indefinite (Until Reviewed)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="notify-tenant" />
              <Label htmlFor="notify-tenant" className="font-normal">
                Notify tenant via email about suspension
              </Label>
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
              onClick={() => setSuspendDialogOpen(false)}
            >
              Suspend Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Tenant Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Remove Tenant Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently remove this tenant account?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="remove-reason">Removal Reason</Label>
              <Select>
                <SelectTrigger id="remove-reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lease-ended">Lease Ended</SelectItem>
                  <SelectItem value="tenant-request">Tenant Request</SelectItem>
                  <SelectItem value="eviction">Eviction</SelectItem>
                  <SelectItem value="duplicate">Duplicate Account</SelectItem>
                  <SelectItem value="other">Other (Please Specify)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="remove-notes">Additional Notes</Label>
              <Textarea
                id="remove-notes"
                placeholder="Provide additional details about the removal reason..."
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="confirm-removal" />
              <Label htmlFor="confirm-removal" className="font-normal">
                I confirm that I want to permanently remove this tenant account
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => setRemoveDialogOpen(false)}
            >
              Remove Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Admin Message Dialog */}
      <Dialog
        open={newMessageDialogOpen}
        onOpenChange={setNewMessageDialogOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Admin Message</DialogTitle>
            <DialogDescription>
              Add an administrative message to the dispute communication.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="message-content">Message</Label>
              <Textarea
                id="message-content"
                placeholder="Enter your message..."
                rows={6}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewMessageDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setNewMessageDialogOpen(false);
                setNewMessage("");
              }}
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

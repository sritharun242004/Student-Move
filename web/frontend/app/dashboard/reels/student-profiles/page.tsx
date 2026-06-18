"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
  ShieldBan,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ReelsAdminService } from "@/services/reels.service";
import type { AdminStudentProfile, StudentProfileStatus } from "@/types/reelTypes";

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "ACTIVE", label: "Active" },
  { value: "BANNED", label: "Banned" },
] as const;

type FilterStatus = "all" | "ACTIVE" | "BANNED";

function StatusBadge({ status }: { status: StudentProfileStatus }) {
  switch (status) {
    case "ACTIVE":
      return (
        <Badge variant="secondary" className="gap-1 text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    case "BANNED":
      return (
        <Badge variant="destructive" className="gap-1">
          <ShieldBan className="h-3 w-3" />
          Banned
        </Badge>
      );
    case "ACTIVELY_MOVING":
      return <Badge variant="outline" className="gap-1">Actively Moving</Badge>;
    case "COMPLETED_MOVE":
      return <Badge variant="outline" className="gap-1">Completed Move</Badge>;
    case "INACTIVE":
      return <Badge variant="secondary" className="gap-1">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function StudentProfilesPage() {
  const { data: session } = useSession();

  const [profiles, setProfiles] = useState<AdminStudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState<{
    profile: AdminStudentProfile;
    newStatus: "ACTIVE" | "BANNED";
  } | null>(null);

  useEffect(() => {
    if (session?.access && session?.role === "admin") {
      loadProfiles();
    }
  }, [session?.access, session?.role, filterStatus]);

  const loadProfiles = async () => {
    if (!session?.access) return;
    setLoading(true);
    try {
      const data = await ReelsAdminService.listStudentProfiles(
        session.access,
        filterStatus !== "all" ? { status: filterStatus, limit: 50 } : { limit: 50 }
      );
      setProfiles(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load student profiles");
    }
    setLoading(false);
  };

  const handleUpdateStatus = async () => {
    if (!statusDialog || !session?.access) return;
    const { profile, newStatus } = statusDialog;
    setActionLoading(profile.userId);
    try {
      await ReelsAdminService.updateStudentStatus(profile.userId, newStatus, session.access);
      toast.success(`Student ${newStatus === "BANNED" ? "banned" : "reactivated"} successfully`);
      setProfiles((prev) =>
        prev.map((p) => (p.userId === profile.userId ? { ...p, status: newStatus } : p))
      );
      setStatusDialog(null);
    } catch {
      toast.error("Failed to update student status");
    }
    setActionLoading(null);
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  if (session?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] text-muted-foreground">
        <p>Admin access required.</p>
      </div>
    );
  }

  const filteredProfiles = profiles.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.displayName.toLowerCase().includes(q) ||
      p.userId.toLowerCase().includes(q) ||
      (p.bio && p.bio.toLowerCase().includes(q))
    );
  });

  return (
    <div className="mx-auto container space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Profiles</h1>
        <p className="text-muted-foreground mt-1">
          Manage student accounts and their statuses
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch("")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as FilterStatus)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {filteredProfiles.length} student{filteredProfiles.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Users className="h-12 w-12 mb-3" />
          <p>No student profiles found</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Bio</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Following</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Profile Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted overflow-hidden flex-shrink-0">
                        {profile.profilePhotoUrl ? (
                          <img
                            src={profile.profilePhotoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm font-medium">
                            {profile.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-sm">{profile.displayName}</p>
                          <Link
                            href={`/dashboard/reels/profile/${profile.userId}`}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="View profile"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{profile.userId}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground max-w-xs whitespace-normal break-words">
                      {profile.bio || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm">{profile.followersCount}</TableCell>
                  <TableCell className="text-sm">{profile.followingCount}</TableCell>
                  <TableCell>
                    <StatusBadge status={profile.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(profile.createdAt)}
                  </TableCell>
                  <TableCell>
                    {profile.status === "BANNED" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setStatusDialog({ profile, newStatus: "ACTIVE" })
                        }
                        disabled={actionLoading === profile.userId}
                      >
                        {actionLoading === profile.userId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Unban
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setStatusDialog({ profile, newStatus: "BANNED" })
                        }
                        disabled={actionLoading === profile.userId}
                        className="text-destructive hover:text-destructive"
                      >
                        {actionLoading === profile.userId ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <ShieldBan className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Ban
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Status Change Confirmation Dialog */}
      <Dialog
        open={statusDialog !== null}
        onOpenChange={(open) => !open && setStatusDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {statusDialog?.newStatus === "BANNED" ? "Ban Student" : "Unban Student"}
            </DialogTitle>
            <DialogDescription>
              {statusDialog?.newStatus === "BANNED"
                ? `Are you sure you want to ban ${statusDialog?.profile.displayName}? They will lose access to the platform.`
                : `Are you sure you want to unban ${statusDialog?.profile.displayName}? They will regain access to the platform.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setStatusDialog(null)}>
              Cancel
            </Button>
            <Button
              variant={statusDialog?.newStatus === "BANNED" ? "destructive" : "default"}
              onClick={handleUpdateStatus}
              disabled={actionLoading !== null}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : statusDialog?.newStatus === "BANNED" ? (
                <ShieldBan className="h-4 w-4 mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {statusDialog?.newStatus === "BANNED" ? "Ban" : "Unban"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

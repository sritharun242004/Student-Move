"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Flag,
  Trash2,
  Eye,
  ShieldAlert,
  Video,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Heart,
  MessageCircle,
  Play,
  Share2,
  X,
} from "lucide-react";
import { ReelsAdminService } from "@/services/reels.service";
import type { Reel, ReelReport } from "@/types/reelTypes";
import ReelPlayerModal from "@/components/reels/ReelPlayerModal";

const TAB_TRIGGER_CLASS =
  "relative flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2.5 font-medium text-muted-foreground transition-colors duration-300 data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-transparent bg-transparent hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 data-[state=active]:after:scale-x-100";

export default function ReelsAdminPage() {
  const { data: session } = useSession();

  const [allReels, setAllReels] = useState<Reel[]>([]);
  const [flaggedReels, setFlaggedReels] = useState<Reel[]>([]);
  const [reports, setReports] = useState<ReelReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewReel, setPreviewReel] = useState<Reel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteReportConfirm, setDeleteReportConfirm] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerStartIndex, setPlayerStartIndex] = useState(0);

  useEffect(() => {
    console.log("[ReelsAdmin] session:", { access: !!session?.access, role: session?.role });
    if (session?.access && session?.role === "admin") {
      loadAll();
    }
  }, [session?.access, session?.role]);

  const loadAll = async () => {
    if (!session?.access) {
      console.warn("[ReelsAdmin] loadAll called without access token");
      return;
    }
    setLoading(true);
    console.log("[ReelsAdmin] loadAll: fetching...");
    const [allResult, flaggedResult, reportsResult] = await Promise.allSettled([
      ReelsAdminService.listReels(session.access, { limit: 100 }),
      ReelsAdminService.listReels(session.access, { flaggedOnly: true, limit: 100 }),
      ReelsAdminService.listReports(session.access),
    ]);

    console.log("[ReelsAdmin] allResult:", allResult);
    console.log("[ReelsAdmin] flaggedResult:", flaggedResult);
    console.log("[ReelsAdmin] reportsResult:", reportsResult);

    if (allResult.status === "fulfilled") {
      console.log("[ReelsAdmin] all reels raw data:", allResult.value);
      const allData = allResult.value;
      setAllReels(Array.isArray(allData) ? allData : allData.items || []);
    } else {
      console.error("[ReelsAdmin] all reels error:", allResult.reason);
      toast.error("Failed to load reels");
    }
    if (flaggedResult.status === "fulfilled") {
      const flaggedData = flaggedResult.value;
      setFlaggedReels(Array.isArray(flaggedData) ? flaggedData : flaggedData.items || []);
    } else {
      console.error("[ReelsAdmin] flagged reels error:", flaggedResult.reason);
    }
    if (reportsResult.status === "fulfilled") {
      setReports(reportsResult.value || []);
    } else {
      console.error("[ReelsAdmin] reports error:", reportsResult.reason);
      toast.error("Failed to load reports");
    }
    setLoading(false);
  };

  const handleToggleFlag = async (reel: Reel) => {
    if (!session?.access) return;
    setActionLoading(reel.id);
    try {
      await ReelsAdminService.flagReel(reel.id, !reel.isFlagged, session.access);
      toast.success(reel.isFlagged ? "Reel unflagged" : "Reel flagged");
      await loadAll();
    } catch {
      toast.error("Failed to update flag");
    }
    setActionLoading(null);
  };

  const handleDeleteReel = async (reelId: string) => {
    if (!session?.access) return;
    setActionLoading(reelId);
    try {
      await ReelsAdminService.deleteReel(reelId, session.access);
      toast.success("Reel deleted successfully");
      setDeleteConfirm(null);
      await loadAll();
    } catch {
      toast.error("Failed to delete reel");
    }
    setActionLoading(null);
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!session?.access) return;
    setActionLoading(reportId);
    try {
      await ReelsAdminService.deleteReport(reportId, session.access);
      toast.success("Report deleted");
      setDeleteReportConfirm(null);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch {
      toast.error("Failed to delete report");
    }
    setActionLoading(null);
  };

  const handleUpdateReportStatus = async (
    report: ReelReport,
    status: "PENDING" | "REVIEWED"
  ) => {
    if (!session?.access) return;
    setActionLoading(report.id);
    try {
      await ReelsAdminService.updateReportStatus(report.id, status, session.access);
      toast.success(`Report marked as ${status.toLowerCase()}`);
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status } : r))
      );
    } catch {
      toast.error("Failed to update report status");
    }
    setActionLoading(null);
  };

  if (session?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] text-muted-foreground">
        <p>Admin access required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const renderReelRow = (reel: Reel) => (
    <TableRow key={reel.id}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-12 w-9 bg-black rounded overflow-hidden flex-shrink-0">
            <video
              src={`${reel.videoUrl}#t=0.001`}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          </div>
          <div>
            <p className="font-medium text-sm line-clamp-1">
              {reel.caption || "No caption"}
            </p>
            <p className="text-xs text-muted-foreground">{reel.durationSeconds}s</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-muted overflow-hidden">
            {reel.creator.profilePhotoUrl ? (
              <img
                src={reel.creator.profilePhotoUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <User className="h-3 w-3" />
              </div>
            )}
          </div>
          <span className="text-sm">{reel.creator.displayName}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {reel.likesCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {reel.commentsCount}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" />
            {reel.sharesCount}
          </span>
        </div>
      </TableCell>
      <TableCell>
        {reel.isFlagged ? (
          <Badge variant="destructive">Flagged</Badge>
        ) : (
          <Badge variant="secondary">Active</Badge>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {formatDate(reel.createdAt)}
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPreviewReel(reel)}
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleToggleFlag(reel)}
            disabled={actionLoading === reel.id}
            title={reel.isFlagged ? "Unflag" : "Flag"}
          >
            {actionLoading === reel.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Flag
                className={`h-4 w-4 ${reel.isFlagged ? "text-red-500 fill-red-500" : ""}`}
              />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteConfirm(reel.id)}
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  const renderReportRow = (report: ReelReport) => {
    const reel = allReels.find((r) => r.id === report.reelId);
    return (
      <TableRow key={report.id}>
        <TableCell>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-muted overflow-hidden flex-shrink-0">
              {report.student.profilePhotoUrl ? (
                <img
                  src={report.student.profilePhotoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <User className="h-3 w-3" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{report.student.displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {report.student.status.toLowerCase().replace("_", " ")}
              </p>
            </div>
          </div>
        </TableCell>
        {/* Reel thumbnail */}
        <TableCell>
          {reel ? (
            <div className="flex items-center gap-2">
              <div className="h-14 w-10 bg-black rounded overflow-hidden flex-shrink-0">
                <video
                  src={`${reel.videoUrl}#t=0.001`}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              </div>
              <div>
                <p className="text-sm font-medium line-clamp-2 max-w-[140px]">
                  {reel.caption || "No caption"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {reel.durationSeconds}s
                </p>
              </div>
            </div>
          ) : (
            <div className="h-14 w-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
              <Video className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </TableCell>
        <TableCell>
          <p className="text-sm font-medium">{report.reason}</p>
        </TableCell>
        <TableCell>
          <p className="text-sm text-muted-foreground max-w-xs whitespace-normal break-words">
            {report.details || "—"}
          </p>
        </TableCell>
        <TableCell>
          {report.status === "PENDING" ? (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              Pending
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1 text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              Reviewed
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground">
          {formatDate(report.createdAt)}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            {reel && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const idx = allReels.findIndex((r) => r.id === reel.id);
                  setPlayerStartIndex(idx >= 0 ? idx : 0);
                  setPlayerOpen(true);
                }}
                title="Preview reel"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {report.status === "PENDING" ? (
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleUpdateReportStatus(report, "REVIEWED")}
                disabled={actionLoading === report.id}
                title="Mark Reviewed"
              >
                {actionLoading === report.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleUpdateReportStatus(report, "PENDING")}
                disabled={actionLoading === report.id}
                title="Reopen"
                className="text-muted-foreground"
              >
                {actionLoading === report.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </Button>
            )}
            {reel && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleFlag(reel)}
                  disabled={actionLoading === reel.id}
                  title={reel.isFlagged ? "Unflag" : "Flag"}
                >
                  {actionLoading === reel.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Flag
                      className={`h-4 w-4 ${
                        reel.isFlagged ? "text-red-500 fill-red-500" : ""
                      }`}
                    />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteConfirm(reel.id)}
                  title="Delete reel"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteReportConfirm(report.id)}
              title="Delete report"
            >
              <X className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const pendingReportsCount = reports.filter((r) => r.status === "PENDING").length;

  return (
    <div className="mx-auto container space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reels Moderation</h1>
        <p className="text-muted-foreground mt-1">
          Manage and moderate student reels
        </p>
      </div>

      <Tabs defaultValue="all">
        <div className="flex items-center border-b">
          <TabsList className="w-auto justify-start gap-1 bg-transparent p-0 rounded-none">
            <TabsTrigger value="all" className={TAB_TRIGGER_CLASS}>
              <Video className="h-4 w-4" />
              All Reels
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                {allReels.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="reported" className={TAB_TRIGGER_CLASS}>
              <AlertTriangle className="h-4 w-4" />
              Reported
              {pendingReportsCount > 0 && (
                <span className="ml-1 rounded-full border-destructive border-2 text-destructive-foreground px-2 py-0.5 text-xs font-semibold">
                  {pendingReportsCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="flagged" className={TAB_TRIGGER_CLASS}>
              <Flag className="h-4 w-4" />
              Flagged
              <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
                {flaggedReels.length}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* All Reels */}
        <TabsContent value="all">
          {allReels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Video className="h-12 w-12 mb-3" />
              <p>No reels in the system</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
              {allReels.map((reel, index) => (
                <div
                  key={reel.id}
                  className="relative group aspect-[9/16] bg-black rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => {
                    setPlayerStartIndex(index);
                    setPlayerOpen(true);
                  }}
                >
                  <video
                    src={`${reel.videoUrl}#t=0.001`}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />

                  {/* Flag button top-right */}
                  <button
                    className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFlag(reel);
                    }}
                    title={reel.isFlagged ? "Unflag" : "Flag"}
                  >
                    {actionLoading === reel.id ? (
                      <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                    ) : (
                      <Flag
                        className={`h-3.5 w-3.5 ${
                          reel.isFlagged ? "text-red-400 fill-red-400" : "text-white"
                        }`}
                      />
                    )}
                  </button>

                  {reel.isFlagged && (
                    <Badge
                      variant="destructive"
                      className="absolute top-2 left-2 text-[10px] z-10"
                    >
                      Flagged
                    </Badge>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="h-5 w-5 text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-5">
                      <span className="flex items-center gap-1.5 text-white text-sm">
                        <Heart className="h-4 w-4" />
                        {reel.likesCount}
                      </span>
                      <span className="flex items-center gap-1.5 text-white text-sm">
                        <MessageCircle className="h-4 w-4" />
                        {reel.commentsCount}
                      </span>
                    </div>
                  </div>

                  {/* Creator name */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-0 transition-opacity duration-300">
                    <p className="text-white text-xs font-medium truncate">{reel.creator.displayName}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Reported */}
        <TabsContent value="reported">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mb-3" />
              <p>No reports submitted</p>
            </div>
          ) : (
            <div className="rounded-md border mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Reel</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{reports.map(renderReportRow)}</TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Flagged */}
        <TabsContent value="flagged">
          {flaggedReels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <ShieldAlert className="h-12 w-12 mb-3" />
              <p>No flagged reels</p>
            </div>
          ) : (
            <div className="rounded-md border mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reel</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{flaggedReels.map(renderReelRow)}</TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Reel Player Modal (All Reels tab) */}
      <ReelPlayerModal
        reels={allReels}
        startIndex={playerStartIndex}
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
      />

      {/* Preview Dialog */}
      <Dialog
        open={previewReel !== null}
        onOpenChange={(open) => !open && setPreviewReel(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reel Preview</DialogTitle>
            <DialogDescription>
              by {previewReel?.creator.displayName}
            </DialogDescription>
          </DialogHeader>
          {previewReel && (
            <div className="space-y-3">
              <div className="aspect-[9/16] max-h-[400px] mx-auto bg-black rounded-lg overflow-hidden">
                <video
                  src={previewReel.videoUrl}
                  className="w-full h-full object-contain"
                  controls
                  muted
                />
              </div>
              <p className="text-sm">{previewReel.caption}</p>
              {previewReel.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {previewReel.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>❤ {previewReel.likesCount} likes</span>
                <span>💬 {previewReel.commentsCount} comments</span>
                <span>🔗 {previewReel.sharesCount} shares</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={previewReel.isFlagged ? "outline" : "destructive"}
                  size="sm"
                  onClick={() => handleToggleFlag(previewReel)}
                  disabled={actionLoading === previewReel.id}
                >
                  {actionLoading === previewReel.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Flag className="h-4 w-4 mr-2" />
                  )}
                  {previewReel.isFlagged ? "Unflag" : "Flag"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirm(previewReel.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this reel? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDeleteReel(deleteConfirm)}
              disabled={actionLoading !== null}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Report Confirmation Dialog */}
      <Dialog
        open={deleteReportConfirm !== null}
        onOpenChange={(open) => !open && setDeleteReportConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteReportConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteReportConfirm && handleDeleteReport(deleteReportConfirm)}
              disabled={actionLoading !== null}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

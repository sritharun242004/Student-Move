"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Edit,
  Video,
  Share2,
  User,
  Trash2,
  Camera,
  Heart,
  MessageCircle,
  Play,
  ShieldBan,
} from "lucide-react";
import { useReelsStore } from "@/stores/reelsStore";
import { ReelsService } from "@/services/reels.service";
import type { Reel } from "@/types/reelTypes";
import ReelPlayerModal from "@/components/reels/ReelPlayerModal";
import FollowListModal from "@/components/reels/FollowListModal";

export default function MyReelProfilePage() {
  const { data: session } = useSession();
  const {
    myProfile,
    profileLoading,
    fetchMyProfile,
    updateMyProfile,
    deleteReel,
  } = useReelsStore();

  const [editOpen, setEditOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhotoUrl, setEditPhotoUrl] = useState("");
  const [selectedProfileImage, setSelectedProfileImage] = useState<File | null>(null);
  const [selectedProfileImagePreview, setSelectedProfileImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);

  useEffect(() => {
    if (session?.access) {
      fetchMyProfile(session.access);
    }
  }, [session?.access, fetchMyProfile]);

  useEffect(() => {
    if (!selectedProfileImage) {
      setSelectedProfileImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(selectedProfileImage);
    setSelectedProfileImagePreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedProfileImage]);

  const openEditDialog = () => {
    if (!myProfile) return;
    setEditDisplayName(myProfile.displayName);
    setEditBio(myProfile.bio);
    setEditPhotoUrl(myProfile.profilePhotoUrl);
    setSelectedProfileImage(null);
    setEditOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!session?.access) return;
    setSaving(true);
    try {
      let uploadedProfileImageUrl = editPhotoUrl?.trim() || undefined;

      if (selectedProfileImage) {
        const uploadResponse = await ReelsService.uploadProfileImage(
          selectedProfileImage,
          session.access
        );
        uploadedProfileImageUrl = uploadResponse.imageUrl;
      }

      const payload: Record<string, string> = {};
      if (editDisplayName?.trim()) payload.displayName = editDisplayName;
      if (editBio?.trim()) payload.bio = editBio;
      if (uploadedProfileImageUrl) payload.profilePhotoUrl = uploadedProfileImageUrl;

      await updateMyProfile(payload, session.access);
      toast.success("Profile updated successfully");
      setSelectedProfileImage(null);
      setEditPhotoUrl("");
      setEditOpen(false);
    } catch {
      toast.error("Failed to update profile");
    }
    setSaving(false);
  };

  const handleDeleteReel = async (reelId: string) => {
    if (!session?.access) return;
    const success = await deleteReel(reelId, session.access);
    if (success) {
      toast.success("Reel deleted");
    } else {
      toast.error("Failed to delete reel");
    }
  };

  if (profileLoading && !myProfile) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!myProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-muted-foreground">
        <User className="h-16 w-16 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Profile Yet</h2>
        <p className="text-sm">Your reel profile will be created when you upload your first reel.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
    
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="h-32 w-32 rounded-full bg-muted overflow-hidden flex-shrink-0">
              {myProfile.profilePhotoUrl ? (
                <img
                  src={myProfile.profilePhotoUrl}
                  alt={myProfile.displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <User className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{myProfile.displayName}</h1>
                </div>
                <Button variant="outline" size="sm" onClick={openEditDialog} className="sm:gap-2">
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit Profile</span>
                </Button>
              </div>
              <div className="flex gap-2 md:gap-6 mt-4">
                <div className="text-center">
                  <p className="font-semibold">{myProfile.uploadedReels.length}</p>
                  <p className="text-xs text-muted-foreground">Reels</p>
                </div>
                <button
                  type="button"
                  className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => setFollowModal("followers")}
                >
                  <p className="font-semibold">{myProfile.followersCount}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </button>
                <button
                  type="button"
                  className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => setFollowModal("following")}
                >
                  <p className="font-semibold">{myProfile.followingCount}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </button>
                
              </div>
              <p 
                className={`text-muted-foreground mt-4 text-sm whitespace-pre-wrap break-words transition-all duration-300 ${
                  bioExpanded ? "max-h-none" : "max-h-[80px] overflow-hidden"
                }`}
              >
                {myProfile.bio}
              </p>
              {myProfile.bio && (myProfile.bio.split("\n").length > 3 || myProfile.bio.length > 150) && (
                <button
                  onClick={() => setBioExpanded(!bioExpanded)}
                  className="text-primary text-sm font-medium mt-2 hover:underline"
                >
                  {bioExpanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Banned banner */}
      {myProfile.status === "BANNED" && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-destructive">
          <ShieldBan className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Your account has been suspended. Please contact{" "}
            <a
              href="mailto:support@studentmoves.com"
              className="underline underline-offset-2 hover:opacity-80"
            >
              StudentMoves support
            </a>{" "}
            to reactivate your account.
          </p>
        </div>
      )}



      {/* Reels Tabs */}
      <Tabs defaultValue="uploaded">
        <TabsList className="w-full justify-start gap-1 bg-transparent p-0 border-b rounded-none">
          <TabsTrigger
            value="uploaded"
            className="relative flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2.5 font-medium text-muted-foreground transition-colors duration-300 data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-transparent bg-transparent hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 data-[state=active]:after:scale-x-100"
          >
            <Video className="h-4 w-4" />
            My Reels
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
              {myProfile.uploadedReels.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="shared"
            className="relative flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2.5 font-medium text-muted-foreground transition-colors duration-300 data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-transparent bg-transparent hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 data-[state=active]:after:scale-x-100"
          >
            <Share2 className="h-4 w-4" />
            Shared
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
              {myProfile.sharedReels.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="uploaded">
          <ReelGrid
            reels={myProfile.uploadedReels}
            emptyMessage="You haven't uploaded any reels yet."
            showDelete
            onDelete={handleDeleteReel}
          />
        </TabsContent>

        <TabsContent value="shared">
          <ReelGrid
            reels={myProfile.sharedReels}
            emptyMessage="You haven't shared any reels yet."
          />
        </TabsContent>
      </Tabs>

      {/* Follow List Modal */}
      {followModal && myProfile && session?.access && (
        <FollowListModal
          open={!!followModal}
          onClose={() => setFollowModal(null)}
          mode={followModal}
          studentId={String(myProfile.userId)}
          token={session.access}
        />
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Profile Photo - Round Avatar with Camera Overlay */}
            <div className="flex flex-col items-center">
              <label className="relative group cursor-pointer">
                <div className="h-28 w-28 rounded-full overflow-hidden bg-muted ring-4 ring-background shadow-lg">
                  {(selectedProfileImagePreview || editPhotoUrl) ? (
                    <img
                      src={selectedProfileImagePreview || editPhotoUrl}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {/* Camera overlay */}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                {/* Small camera badge */}
                <div className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary flex items-center justify-center shadow-md border-2 border-background">
                  <Camera className="h-4 w-4 text-primary-foreground" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedProfileImage(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
              {selectedProfileImage && (
                <p className="text-xs text-muted-foreground mt-2">
                  {selectedProfileImage.name}
                </p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Your display name"
                className="mt-1"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="text-sm font-medium">Bio</label>
              <textarea
                className="w-full mt-1 p-2 border rounded-md text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-transparent"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell others about yourself..."
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSaveProfile}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Reel Grid Component ────────────────────────────────────

interface ReelGridProps {
  reels: Reel[];
  emptyMessage: string;
  showDelete?: boolean;
  onDelete?: (reelId: string) => void;
}

function ReelGrid({ reels, emptyMessage, showDelete, onDelete }: ReelGridProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerStartIndex, setPlayerStartIndex] = useState(0);

  const openPlayer = (index: number) => {
    setPlayerStartIndex(index);
    setPlayerOpen(true);
  };

  if (reels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Video className="h-12 w-12 mb-3" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Reel</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this reel? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive  text-white hover:bg-destructive/90"
                onClick={() => {
                  if (deleteConfirmId && onDelete) {
                    onDelete(deleteConfirmId);
                  }
                  setDeleteConfirmId(null);
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {reels.map((reel, index) => (
          <div
            key={reel.id}
            className="relative group aspect-[9/16] bg-black rounded-xl overflow-hidden cursor-pointer"
            onClick={() => openPlayer(index)}
          >
            <video
              src={`${reel.videoUrl}#t=0.001`}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Play icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="h-5 w-5 text-white ml-0.5" />
                </div>
              </div>
              {/* Stats at bottom */}
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
            {showDelete && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmId(reel.id);
                }}
                className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            {reel.isFlagged && (
              <Badge
                variant="destructive"
                className="absolute top-2 left-2 text-[10px]"
              >
                Flagged
              </Badge>
            )}
          </div>
        ))}
      </div>

      {/* Reel Player Modal */}
      <ReelPlayerModal
        reels={reels}
        startIndex={playerStartIndex}
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
      />
    </>
  );
}
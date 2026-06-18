"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Video,
  Share2,
  User,
  UserPlus,
  UserMinus,
  ArrowLeft,
  Play,
  Heart,
  MessageCircle,
} from "lucide-react";
import { useReelsStore } from "@/stores/reelsStore";
import type { Reel } from "@/types/reelTypes";
import ReelPlayerModal from "@/components/reels/ReelPlayerModal";
import FollowListModal from "@/components/reels/FollowListModal";

export default function StudentProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId as string;

  const {
    viewingProfile,
    profileLoading,
    fetchStudentProfile,
    followStudent,
    unfollowStudent,
  } = useReelsStore();

  const isTenant = session?.role === "tenant";
  const isOwnProfile = String(session?.id) === String(viewingProfile?.userId ?? "");
  const [bioExpanded, setBioExpanded] = useState(false);
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);

  useEffect(() => {
    if (session?.access && studentId) {
      fetchStudentProfile(studentId, session.access);
    }
  }, [session?.access, studentId, fetchStudentProfile]);

  const handleFollow = async () => {
    if (!session?.access || !isTenant) return;
    try {
      await followStudent(studentId, session.access);
      toast.success("Followed successfully");
    } catch {
      toast.error("Failed to follow");
    }
  };

  const handleUnfollow = async () => {
    if (!session?.access || !isTenant) return;
    try {
      await unfollowStudent(studentId, session.access);
      toast.success("Unfollowed");
    } catch {
      toast.error("Failed to unfollow");
    }
  };

  if (profileLoading && !viewingProfile) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!viewingProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-muted-foreground">
        <User className="h-16 w-16 mb-4" />
        <h2 className="text-xl font-semibold">Student not found</h2>
      </div>
    );
  }

  if (viewingProfile.status === "BANNED") {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-muted-foreground">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <User className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Account Unavailable</h2>
        <p className="text-sm mt-2 max-w-xs text-center">
          This student&apos;s profile is no longer active.
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-6 flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="h-32 w-32 rounded-full bg-muted overflow-hidden flex-shrink-0">
              {viewingProfile.profilePhotoUrl ? (
                <img
                  src={viewingProfile.profilePhotoUrl}
                  alt={viewingProfile.displayName}
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
                  <h1 className=" text-xl md:text-2xl font-bold">{viewingProfile.displayName}</h1>
                </div>
                {isTenant && !isOwnProfile && (
                  <div>
                    {viewingProfile.isFollowedByViewer ? (
                      <Button variant="outline" size="sm" onClick={handleUnfollow}>
                        <UserMinus className="h-4 w-4 mr-2" />
                        Unfollow
                      </Button>
                    ) : (
                      <Button size="sm" onClick={handleFollow}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-3 md:gap-6 mt-4">
                <div className="text-center">
                  <p className="font-semibold">{viewingProfile.uploadedReels.length}</p>
                  <p className="text-xs text-muted-foreground">Reels</p>
                </div>
                <button
                  type="button"
                  className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => setFollowModal("followers")}
                >
                  <p className="font-semibold">{viewingProfile.followersCount}</p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </button>
                <button
                  type="button"
                  className="text-center cursor-pointer hover:opacity-70 transition-opacity"
                  onClick={() => setFollowModal("following")}
                >
                  <p className="font-semibold">{viewingProfile.followingCount}</p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </button>
              </div>
              <p
                className={`text-muted-foreground mt-4 text-sm whitespace-pre-wrap break-words transition-all duration-300 ${
                  bioExpanded ? "max-h-none" : "max-h-[80px] overflow-hidden"
                }`}
              >
                {viewingProfile.bio}
              </p>
              {viewingProfile.bio &&
                (viewingProfile.bio.split("\n").length > 3 ||
                  viewingProfile.bio.length > 150) && (
                  <button
                    onClick={() => setBioExpanded(!bioExpanded)}
                    className="text-primary text-sm font-medium mt-2 cursor-pointer"
                  >
                    {bioExpanded ? "Show less" : "Show more"}
                  </button>
                )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reels Tabs */}
      <Tabs defaultValue="uploaded">
        <TabsList className="w-full justify-start gap-1 bg-transparent p-0 border-b rounded-none">
          <TabsTrigger
            value="uploaded"
            className="relative flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2.5 font-medium text-muted-foreground transition-colors duration-300 data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-transparent bg-transparent hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 data-[state=active]:after:scale-x-100"
          >
            <Video className="h-4 w-4" />
            Reels
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
              {viewingProfile.uploadedReels.length}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="shared"
            className="relative flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2.5 font-medium text-muted-foreground transition-colors duration-300 data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-transparent bg-transparent hover:text-foreground after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-300 data-[state=active]:after:scale-x-100"
          >
            <Share2 className="h-4 w-4" />
            Shared
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">
              {viewingProfile.sharedReels.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="uploaded">
          <ReelGrid
            reels={viewingProfile.uploadedReels}
            emptyMessage="No reels yet."
          />
        </TabsContent>

        <TabsContent value="shared">
          <ReelGrid
            reels={viewingProfile.sharedReels}
            emptyMessage="No shared reels yet."
          />
        </TabsContent>
      </Tabs>

      {/* Follow List Modal */}
      {followModal && viewingProfile && session?.access && (
        <FollowListModal
          open={!!followModal}
          onClose={() => setFollowModal(null)}
          mode={followModal}
          studentId={viewingProfile.userId}
          token={session.access}
        />
      )}
    </div>
  );
}

// ─── Reel Grid ──────────────────────────────────────────────

function ReelGrid({ reels, emptyMessage }: { reels: Reel[]; emptyMessage: string }) {
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
            {reel.isFlagged && (
              <Badge variant="destructive" className="absolute top-2 left-2 text-[10px]">
                Flagged
              </Badge>
            )}
          </div>
        ))}
      </div>

      <ReelPlayerModal
        reels={reels}
        startIndex={playerStartIndex}
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
      />
    </>
  );
}

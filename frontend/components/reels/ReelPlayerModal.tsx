"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Heart,
  MessageCircle,
  Share2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Send,
  X,
  ChevronUp,
  ChevronDown,
  User,
  Loader2,
  MoreVertical,
  Trash2,
  Flag,
  Link2,
  Link,
  SendIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useReelsStore } from "@/stores/reelsStore";
import { ReelsService } from "@/services/reels.service";
import type { Reel, ReelComment, ReelLike } from "@/types/reelTypes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ReelPlayerModalProps {
  reels: Reel[];
  startIndex: number;
  open: boolean;
  onClose: () => void;
  isPublic?: boolean;
}

export default function ReelPlayerModal({
  reels,
  startIndex,
  open,
  onClose,
  isPublic = false,
}: ReelPlayerModalProps) {
  const { data: session } = useSession();
  const { toggleLike, toggleShare, addComment, deleteComment, myProfile } =
    useReelsStore();

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<ReelComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  const [likes, setLikes] = useState<ReelLike[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);
  const [likesOpen, setLikesOpen] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewerLiked, setViewerLiked] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const canInteract = session?.role !== undefined && session?.role !== "merchant";
  const viewerUserId = String(myProfile?.userId ?? session?.id ?? "");
  const viewerRole = (session as { role?: string } | null)?.role;
  const isAdmin = viewerRole === "admin";
  const currentReel = reels[currentIndex];

  const goToProfile = useCallback(
    (userId: string) => {
      onClose();
      router.push(`/dashboard/reels/profile/${userId}`);
    },
    [onClose, router]
  );

  // Reset index when opened
  useEffect(() => {
    if (open) {
      setCurrentIndex(startIndex);
      setIsPlaying(true);
      setShowComments(false);
      setComments([]);
      setLikes([]);
      setLikesOpen(false);
      setReportOpen(false);
      setReportReason("");
      setReportDetails("");
    }
  }, [open, startIndex]);

  // Load comments/likes when reel changes
  useEffect(() => {
    if (!open || !currentReel || !session?.access) return;

    let cancelled = false;
    setCommentsLoading(true);
    setLikesLoading(true);

    // Seed counts from reel while loading (keeps UI stable)
    setCommentsCount(currentReel.commentsCount ?? 0);
    setLikesCount(currentReel.likesCount ?? 0);
    setViewerLiked(!!currentReel.isLikedByViewer);

    Promise.all([
      ReelsService.getReelComments(currentReel.id, session.access),
      ReelsService.getReelLikes(currentReel.id, session.access),
    ])
      .then(([commentsData, likesData]) => {
        if (cancelled) return;
        setComments(commentsData);
        setCommentsCount(commentsData.length);
        setLikes(likesData);
        setLikesCount(likesData.length);
        setViewerLiked(
          likesData.some((l) => String(l.student.userId) === String(session.id)) ||
            !!currentReel.isLikedByViewer
        );
      })
      .catch(() => {
        if (cancelled) return;
        // Keep silent to avoid spam; UI can still function.
      })
      .finally(() => {
        if (cancelled) return;
        setCommentsLoading(false);
        setLikesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, currentReel?.id, session?.access, session?.id]);

  // Auto-play video when reel changes
  useEffect(() => {
    if (!open || !videoRef.current) return;
    videoRef.current.load();
    videoRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [currentIndex, open]);

  // Scroll to bottom of comments
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const navigateReel = useCallback(
    (direction: "next" | "prev") => {
      if (isTransitioning) return;
      const nextIndex =
        direction === "next" ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= reels.length) return;

      setIsTransitioning(true);
      setCurrentIndex(nextIndex);
      setComments([]);
      setLikes([]);
      setLikesOpen(false);
      setTimeout(() => setIsTransitioning(false), 300);
    },
    [currentIndex, reels.length, isTransitioning]
  );

  // Keyboard controls
  useEffect(() => {
    if (!open) return;

    const isEditableTarget = (target: EventTarget | null) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      if (target.isContentEditable) return true;

      const tag = target.tagName;
      if (tag === "TEXTAREA" || tag === "SELECT") return true;

      if (tag === "INPUT") {
        const input = target as HTMLInputElement;
        const nonTextTypes = new Set([
          "checkbox",
          "radio",
          "button",
          "submit",
          "reset",
          "file",
          "range",
          "color",
        ]);
        return !nonTextTypes.has(input.type);
      }

      return target.getAttribute("role") === "textbox";
    };

    const handleKey = (e: KeyboardEvent) => {
      // Always allow closing the modal
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // If user is typing in a field, don't hijack keys (space, arrows, etc.)
      if (isEditableTarget(e.target) || isEditableTarget(document.activeElement)) {
        return;
      }

      if (e.key === "ArrowDown" || e.key === "j") {
        navigateReel("next");
        return;
      }
      if (e.key === "ArrowUp" || e.key === "k") {
        navigateReel("prev");
        return;
      }
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
        return;
      }
      if (e.key === "m") {
        setIsMuted((m) => !m);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, navigateReel, onClose]);

  // Touch/scroll navigation
  useEffect(() => {
    if (!open) return;
    const el = containerRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 60) {
        navigateReel(diff > 0 ? "next" : "prev");
      }
    };
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) > 30) {
        navigateReel(e.deltaY > 0 ? "next" : "prev");
      }
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    el.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
      el.removeEventListener("wheel", handleWheel);
    };
  }, [open, navigateReel]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleLike = async () => {
    if (!canInteract) {
      toast.error("Sign in to like reels");
      return;
    }
    if (!session?.access || !currentReel) return;

    // Optimistic label update (real list is refreshed after the request)
    let nextViewerLiked = viewerLiked;
    setViewerLiked((prev) => {
      nextViewerLiked = !prev;
      setLikesCount((count) => (prev ? Math.max(0, count - 1) : count + 1));
      return !prev;
    });

    await toggleLike(currentReel.id, session.access);

    // Refresh likes list from server (ensures correct “You and N others”)
    try {
      setLikesLoading(true);
      const likesData = await ReelsService.getReelLikes(
        currentReel.id,
        session.access
      );
      setLikes(likesData);
      setLikesCount(likesData.length);
      setViewerLiked(
        likesData.some((l) => String(l.student.userId) === String(session.id)) ||
          nextViewerLiked
      );
    } catch {
      // ignore
    } finally {
      setLikesLoading(false);
    }
  };

  const handleShare = async () => {
    if (!canInteract) {
      toast.error("Sign in to share reels");
      return;
    }
    if (!session?.access || !currentReel) return;
    await toggleShare(currentReel.id, session.access);
  };

  const handleSendLink = async () => {
    if (!currentReel) return;
    const url = `${window.location.origin}/reels/${currentReel.id}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: currentReel.caption ?? "Check out this reel", url });
      } catch {
        // User cancelled or not supported — fall through to clipboard
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const handleSubmitComment = async () => {
    const text = newComment.trim();
    if (!text || !session?.access || !canInteract || !currentReel) return;

    const now = new Date().toISOString();
    const optimisticId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const optimisticComment: ReelComment = {
      id: optimisticId,
      comment: text,
      createdAt: now,
      updatedAt: now,
      student: {
        userId: String(myProfile?.userId ?? session.id),
        displayName:
          myProfile?.displayName ??
          [session.firstName, session.lastName].filter(Boolean).join(" ") ??
          "You",
        profilePhotoUrl: myProfile?.profilePhotoUrl ?? "",
        status: myProfile?.status ?? "ACTIVE",
      },
    };

    // Update UI immediately
    setComments((prev) => [...prev, optimisticComment]);
    setCommentsCount((prev) => prev + 1);
    setNewComment("");

    setCommentLoading(true);
    const serverComments = await addComment(
      currentReel.id,
      text,
      session.access,
      optimisticComment
    );

    if (serverComments) {
      setComments(serverComments);
      setCommentsCount(serverComments.length);
    } else {
      // Revert optimistic insert
      setComments((prev) => prev.filter((c) => c.id !== optimisticId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
      toast.error("Failed to add comment");
    }
    setCommentLoading(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!session?.access || !currentReel) return;

    const prevComments = comments;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentsCount((prev) => Math.max(0, prev - 1));

    const serverComments = await deleteComment(
      currentReel.id,
      commentId,
      session.access
    );

    if (serverComments) {
      setComments(serverComments);
      setCommentsCount(serverComments.length);
    } else {
      setComments(prevComments);
      setCommentsCount(prevComments.length);
      toast.error("Failed to delete comment");
    }
  };

  const handleReport = async () => {
    if (!session?.access || !currentReel || !reportReason) return;
    setReportLoading(true);
    try {
      await ReelsService.reportReel(
        currentReel.id,
        reportReason,
        reportDetails.trim(),
        session.access
      );
      toast.success("Reel reported. Thank you for your feedback.");
      setReportOpen(false);
      setReportReason("");
      setReportDetails("");
    } catch {
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  };

  if (!open || !currentReel) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black">
          {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-[110] text-white/80 hover:text-white p-2 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-colors"
      >
        <X className="h-6 w-6" />
      </button>


      <div className="flex h-full w-full" ref={containerRef}>
        {/* Video section */}
        <div className="relative flex-1 flex items-center justify-center">
          {/* Video */}
          <video
            ref={videoRef}
            src={currentReel.videoUrl}
            className="h-full w-full object-contain transition-opacity duration-300"
            loop
            muted={isMuted}
            playsInline
            autoPlay
            onClick={togglePlayPause}
          />

          {/* Play/Pause overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-16 w-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <Play className="h-8 w-8 text-white ml-1" />
              </div>
            </div>
          )}

          {/* Navigation arrows */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-2 z-10">
            <button
              onClick={() => navigateReel("prev")}
              disabled={currentIndex === 0}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <button
              onClick={() => navigateReel("next")}
              disabled={currentIndex === reels.length - 1}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          {/* Bottom info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pb-8">
            {/* Creator */}
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-full bg-white/20 overflow-hidden flex-shrink-0">
                {currentReel.creator.profilePhotoUrl ? (
                  <img
                    src={currentReel.creator.profilePhotoUrl}
                    alt={currentReel.creator.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white/60" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => goToProfile(currentReel.creator.userId)}
                className="text-white font-semibold text-sm cursor-pointer focus:outline-none"
              >
                {currentReel.creator.displayName}
              </button>
            </div>

            {/* Caption */}
            {currentReel.caption && (
              <p className="text-white/90 text-sm mb-3 max-w-md leading-relaxed">
                {currentReel.caption}
              </p>
            )}

            {/* Tags */}
            {currentReel.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {currentReel.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-blue-300 font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Side action buttons (mobile / no-comments view) */}
          <div className="absolute right-4 bottom-28 flex flex-col items-center gap-5 lg:hidden">
            {!isPublic && (
              <>
                <ActionButton
                  icon={
                    <Heart
                      className={`h-6 w-6 ${viewerLiked ? "fill-red-500 text-red-500" : "text-white"}`}
                    />
                  }
                  label={formatCount(likesCount)}
                  onClick={handleLike}
                />
                <ActionButton
                  icon={<MessageCircle className="h-6 w-6 text-white" />}
                  label={formatCount(commentsCount)}
                  onClick={() => setShowComments(true)}
                />
                <ActionButton
                  icon={
                    <Share2
                      className={`h-6 w-6 ${currentReel.isSharedByViewer ? "text-green-400" : "text-white"}`}
                    />
                  }
                  label={formatCount(currentReel.sharesCount)}
                  onClick={handleShare}
                />
                <ActionButton
                  icon={<SendIcon className="h-6 w-6 text-white" />}
                  label="Send"
                  onClick={handleSendLink}
                />
              </>
            )}
            <button
              onClick={() => setIsMuted((m) => !m)}
              className="p-2 rounded-full bg-white/10 backdrop-blur-sm"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-white" />
              ) : (
                <Volume2 className="h-5 w-5 text-white" />
              )}
            </button>
            {!isPublic && canInteract && String(currentReel.creator.userId) !== viewerUserId && (
              <button
                onClick={() => setReportOpen(true)}
                className="p-2 rounded-full bg-white/10 backdrop-blur-sm"
                title="Report reel"
              >
                <Flag className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Comments panel — desktop (always visible) */}
        <div className="hidden lg:flex w-[380px] flex-col bg-background border-l">
          {/* Panel header */}
          <div className="flex items-center justify-between p-4 border-b">
            {!isPublic && (
              <div className="flex items-center gap-4">
                <ActionButtonCompact
                  icon={
                    <Heart
                      className={`h-5 w-5 ${viewerLiked ? "fill-red-500 text-red-500" : ""}`}
                    />
                  }
                  label={formatCount(likesCount)}
                  onClick={handleLike}
                />
                <ActionButtonCompact
                  icon={<MessageCircle className="h-5 w-5" />}
                  label={formatCount(commentsCount)}
                />
                <ActionButtonCompact
                  icon={
                    <Share2
                      className={`h-5 w-5 ${currentReel.isSharedByViewer ? "text-green-500" : ""}`}
                    />
                  }
                  label={formatCount(currentReel.sharesCount)}
                  onClick={handleShare}
                />
                <ActionButtonCompact
                  icon={<SendIcon className="h-5 w-5" />}
                  label="Send"
                  onClick={handleSendLink}
                />
              </div>
            )}
            {isPublic && <div />}
            <div className="flex items-center gap-1">
              {!isPublic && canInteract && String(currentReel.creator.userId) !== viewerUserId && (
                <button
                  onClick={() => setReportOpen(true)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  title="Report reel"
                >
                  <Flag className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
              <button
                onClick={() => setIsMuted((m) => !m)}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Volume2 className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>
          </div>

          {/* Liked-by label + list */}
          {!isPublic && likesCount > 0 && (
            <div className="px-4 py-2 border-b">
              <button
                type="button"
                onClick={() => setLikesOpen((v) => !v)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {formatLikedByText({
                  likes,
                  likesCount,
                  viewerLiked,
                })}
              </button>

              {likesOpen && (
                <div className="mt-2 max-h-40 overflow-y-auto space-y-2">
                  {likesLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading likes…
                    </div>
                  ) : (
                    likes.map((l) => (
                      <div key={l.id} className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-muted overflow-hidden flex-shrink-0">
                          {l.student.profilePhotoUrl ? (
                            <img
                              src={l.student.profilePhotoUrl}
                              alt={l.student.displayName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => goToProfile(l.student.userId)}
                          className="text-sm cursor-pointer focus:outline-none text-left"
                        >
                          {l.student.displayName}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {commentsLoading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageCircle className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm font-medium">No comments yet</p>
                <p className="text-xs mt-1">Be the first to comment</p>
              </div>
            ) : (
              comments.map((c) => (
                <CommentBubble
                  key={c.id}
                  comment={c}
                  canDelete={
                    isAdmin || String(c.student?.userId ?? "") === viewerUserId
                  }
                  onDelete={() => handleDeleteComment(c.id)}
                  onProfileClick={goToProfile}
                />
              ))
            )}
            <div ref={commentsEndRef} />
          </div>

          {/* Comment input */}
          {!isPublic && canInteract && (
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment();
                    }
                  }}
                  disabled={commentLoading}
                  className="rounded-full"
                />
                <Button
                  size="icon"
                  className="rounded-full flex-shrink-0"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || commentLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {isPublic && (
            <div className="p-4 border-t text-center">
              <p className="text-sm text-muted-foreground">
                <a href="/auth/signin" className="text-primary hover:underline font-medium">Sign in</a> to like, comment &amp; interact
              </p>
            </div>
          )}
        </div>

        {/* Mobile comments sheet */}
        {showComments && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowComments(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="px-4 pb-2 border-b">
                <h3 className="font-semibold text-center">Comments</h3>
              </div>

              {/* Liked-by label + list (mobile) */}
              {likesCount > 0 && (
                <div className="px-4 py-2 border-b">
                  <button
                    type="button"
                    onClick={() => setLikesOpen((v) => !v)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {formatLikedByText({
                      likes,
                      likesCount,
                      viewerLiked,
                    })}
                  </button>

                  {likesOpen && (
                    <div className="mt-2 max-h-36 overflow-y-auto space-y-2">
                      {likesLoading ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Loading likes…
                        </div>
                      ) : (
                        likes.map((l) => (
                          <div key={l.id} className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-muted overflow-hidden flex-shrink-0">
                              {l.student?.profilePhotoUrl ? (
                                <img
                                  src={l.student.profilePhotoUrl}
                                  alt={l.student.displayName}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => goToProfile(l.student.userId)}
                              className="text-sm cursor-pointer focus:outline-none text-left"
                            >
                              {l.student.displayName}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Comments */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <MessageCircle className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm font-medium">No comments yet</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <CommentBubble
                      key={c.id}
                      comment={c}
                      canDelete={
                        isAdmin ||
                        String(c.student?.userId ?? "") === viewerUserId
                      }
                      onDelete={() => handleDeleteComment(c.id)}
                      onProfileClick={goToProfile}
                    />
                  ))
                )}
                <div ref={commentsEndRef} />
              </div>

              {/* Comment input */}
              {canInteract && (
                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitComment();
                        }
                      }}
                      disabled={commentLoading}
                      className="rounded-full"
                    />
                    <Button
                      size="icon"
                      className="rounded-full flex-shrink-0"
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || commentLoading}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Report modal — same portal, higher z-index so it sits above the player */}
      {reportOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => { if (!reportLoading) { setReportOpen(false); } }}
          />
          {/* Panel */}
          <div className="relative z-10 bg-background rounded-lg shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Report Reel</h2>
              <button
                onClick={() => { if (!reportLoading) setReportOpen(false); }}
                className="p-1 rounded-sm hover:bg-muted transition-colors"
                disabled={reportLoading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Reason select */}
            <div className="space-y-1.5">
              <Label htmlFor="report-reason">Reason</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger id="report-reason">
                  <SelectValue placeholder="Select a reason…" />
                </SelectTrigger>
                <SelectContent className="z-[120]">
                  <SelectItem value="Inappropriate content">Inappropriate content</SelectItem>
                  <SelectItem value="Harassment or bullying">Harassment or bullying</SelectItem>
                  <SelectItem value="Spam or misleading">Spam or misleading</SelectItem>
                  <SelectItem value="Hate speech">Hate speech</SelectItem>
                  <SelectItem value="Sexual content or self-harm">Sexual content or self-harm</SelectItem>
                  <SelectItem value="Misinformation">Misinformation</SelectItem>
                  <SelectItem value="Copyright violation">Copyright violation</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Details textarea */}
            <div className="space-y-1.5">
              <Label htmlFor="report-details">
                {reportReason === "Other" ? "Details (required)" : "Additional details (optional)"}
              </Label>
              <Textarea
                id="report-details"
                placeholder="Provide more context…"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                rows={3}
                className="resize-none"
                disabled={reportLoading}
              />
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setReportOpen(false)}
                disabled={reportLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReport}
                disabled={
                  !reportReason ||
                  (reportReason === "other" && !reportDetails.trim()) ||
                  reportLoading
                }
              >
                {reportLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

// ─── Helper Components ─────────────────────────────────────

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group"
    >
      <div className="p-2 rounded-full bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
        {icon}
      </div>
      <span className="text-white text-xs font-medium">{label}</span>
    </button>
  );
}

function ActionButtonCompact({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function CommentBubble({
  comment,
  canDelete,
  onDelete,
  onProfileClick,
}: {
  comment: ReelComment;
  canDelete?: boolean;
  onDelete?: () => void;
  onProfileClick?: (userId: string) => void;
}) {
  const timeAgo = getTimeAgo(comment.createdAt);

  return (
    <div className="flex gap-3 group">
      <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
        {comment.student?.profilePhotoUrl ? (
          <img
            src={comment.student?.profilePhotoUrl}
            alt={comment.student?.displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <button
            type="button"
            onClick={() => comment.student?.userId && onProfileClick?.(comment.student.userId)}
            className="text-sm font-semibold cursor-pointer focus:outline-none text-left"
          >
            {comment.student?.displayName}
          </button>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm text-foreground/90 mt-0.5 break-words">
          {comment.comment}
        </p>
      </div>

      {canDelete && (
        <div className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Comment options"
                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="z-[200]">
              <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  onDelete?.();
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

function formatLikedByText({
  likes,
  likesCount,
  viewerLiked,
}: {
  likes: ReelLike[];
  likesCount: number;
  viewerLiked: boolean;
}): string {
  if (likesCount <= 0) return "";

  if (viewerLiked) {
    const others = Math.max(0, likesCount - 1);
    if (others === 0) return "You like this";
    if (others === 1) return "You and 1 other";
    return `You and ${others} others`;
  }

  const first = likes[0]?.student?.displayName;
  if (!first) {
    if (likesCount === 1) return "1 like";
    return `${likesCount} likes`;
  }
  const others = Math.max(0, likesCount - 1);
  if (others === 0) return `${first} likes this`;
  if (others === 1) return `${first} and 1 other`;
  return `${first} and ${others} others`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

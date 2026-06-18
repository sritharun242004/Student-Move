import { create } from "zustand";
import type {
  Reel,
  StudentProfile,
  ReelFeedTab,
  ReelFeedOrderBy,
  ReelComment,
} from "@/types/reelTypes";
import { ReelsService } from "@/services/reels.service";

interface ReelsStore {
  // Feed state
  feedItems: Reel[];
  feedTab: ReelFeedTab;
  feedOrderBy: ReelFeedOrderBy;
  feedCursor: string | null;
  feedLoading: boolean;
  feedHasMore: boolean;

  // Profile state
  myProfile: StudentProfile | null;
  viewingProfile: StudentProfile | null;
  profileLoading: boolean;

  // Active reel (for detail view / comments)
  activeReel: Reel | null;
  comments: ReelComment[];

  error: string | null;

  // Feed actions
  fetchFeed: (token: string, reset?: boolean) => Promise<void>;
  setFeedTab: (tab: ReelFeedTab) => void;
  setFeedOrderBy: (orderBy: ReelFeedOrderBy) => void;
  loadMoreFeed: (token: string) => Promise<void>;

  // Profile actions
  fetchMyProfile: (token: string) => Promise<void>;
  fetchStudentProfile: (studentId: string, token: string) => Promise<void>;
  updateMyProfile: (
    payload: { displayName?: string; bio?: string; profilePhotoUrl?: string },
    token: string
  ) => Promise<void>;

  // Follow actions
  followStudent: (studentId: string, token: string) => Promise<void>;
  unfollowStudent: (studentId: string, token: string) => Promise<void>;

  // Reel interactions (optimistic)
  toggleLike: (reelId: string, token: string) => Promise<void>;
  toggleShare: (reelId: string, token: string) => Promise<void>;
  addComment: (
    reelId: string,
    comment: string,
    token: string,
    optimisticComment: ReelComment
  ) => Promise<ReelComment[] | null>;

  deleteComment: (
    reelId: string,
    commentId: string,
    token: string
  ) => Promise<ReelComment[] | null>;

  // Reel management
  deleteReel: (reelId: string, token: string) => Promise<boolean>;

  // Utility
  setActiveReel: (reel: Reel | null) => void;
  clearError: () => void;
}

export const useReelsStore = create<ReelsStore>((set, get) => ({
  feedItems: [],
  feedTab: "all",
  feedOrderBy: "chronological",
  feedCursor: null,
  feedLoading: false,
  feedHasMore: true,

  myProfile: null,
  viewingProfile: null,
  profileLoading: false,

  activeReel: null,
  comments: [],
  error: null,

  // ─── Feed ─────────────────────────────────────────────────

  fetchFeed: async (token, reset = true) => {
    set({ feedLoading: true, error: null });
    if (reset) set({ feedItems: [], feedCursor: null, feedHasMore: true });

    try {
      const { feedTab, feedOrderBy } = get();
      const data = await ReelsService.getFeed(token, {
        tab: feedTab,
        orderBy: feedOrderBy,
        limit: 20,
      });
      set({
        feedItems: data.items,
        feedCursor: data.nextCursorCreatedAt,
        feedHasMore: data.nextCursorCreatedAt !== null,
        feedLoading: false,
      });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch feed",
        feedLoading: false,
      });
    }
  },

  loadMoreFeed: async (token) => {
    const { feedCursor, feedHasMore, feedLoading, feedTab, feedOrderBy } =
      get();
    if (!feedHasMore || feedLoading || !feedCursor) return;

    set({ feedLoading: true });
    try {
      const data = await ReelsService.getFeed(token, {
        tab: feedTab,
        orderBy: feedOrderBy,
        limit: 20,
        cursorCreatedAt: feedCursor,
      });
      set((state) => ({
        feedItems: [...state.feedItems, ...data.items],
        feedCursor: data.nextCursorCreatedAt,
        feedHasMore: data.nextCursorCreatedAt !== null,
        feedLoading: false,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load more",
        feedLoading: false,
      });
    }
  },

  setFeedTab: (tab) => set({ feedTab: tab }),
  setFeedOrderBy: (orderBy) => set({ feedOrderBy: orderBy }),

  // ─── Profile ──────────────────────────────────────────────

  fetchMyProfile: async (token) => {
    set({ profileLoading: true, error: null });
    try {
      const profile = await ReelsService.getMyProfile(token);
      set({ myProfile: profile, profileLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to fetch profile",
        profileLoading: false,
      });
    }
  },

  fetchStudentProfile: async (studentId, token) => {
    set({ profileLoading: true, error: null });
    try {
      const profile = await ReelsService.getStudentProfile(studentId, token);
      set({ viewingProfile: profile, profileLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch student profile",
        profileLoading: false,
      });
    }
  },

  updateMyProfile: async (payload, token) => {
    try {
      const updated = await ReelsService.updateMyProfile(payload, token);
      set({ myProfile: updated });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update profile",
      });
      throw error;
    }
  },

  // ─── Follow ───────────────────────────────────────────────

  followStudent: async (studentId, token) => {
    try {
      await ReelsService.followStudent(studentId, token);
      // Update viewing profile optimistically
      set((state) => ({
        viewingProfile: state.viewingProfile
          ? {
              ...state.viewingProfile,
              isFollowedByViewer: true,
              followersCount: state.viewingProfile.followersCount + 1,
            }
          : null,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to follow student",
      });
      throw error;
    }
  },

  unfollowStudent: async (studentId, token) => {
    try {
      await ReelsService.unfollowStudent(studentId, token);
      set((state) => ({
        viewingProfile: state.viewingProfile
          ? {
              ...state.viewingProfile,
              isFollowedByViewer: false,
              followersCount: Math.max(
                0,
                state.viewingProfile.followersCount - 1
              ),
            }
          : null,
      }));
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to unfollow student",
      });
      throw error;
    }
  },

  // ─── Interactions ─────────────────────────────────────────

  toggleLike: async (reelId, token) => {
    const { feedItems } = get();
    const reel = feedItems.find((r) => r.id === reelId);
    if (!reel) return;

    // Optimistic update
    const wasLiked = reel.isLikedByViewer;
    set((state) => ({
      feedItems: state.feedItems.map((r) =>
        r.id === reelId
          ? {
              ...r,
              isLikedByViewer: !wasLiked,
              likesCount: wasLiked
                ? Math.max(0, r.likesCount - 1)
                : r.likesCount + 1,
            }
          : r
      ),
    }));

    try {
      if (wasLiked) {
        await ReelsService.unlikeReel(reelId, token);
      } else {
        await ReelsService.likeReel(reelId, token);
      }
    } catch {
      // Revert on error
      set((state) => ({
        feedItems: state.feedItems.map((r) =>
          r.id === reelId
            ? {
                ...r,
                isLikedByViewer: wasLiked,
                likesCount: wasLiked
                  ? r.likesCount + 1
                  : Math.max(0, r.likesCount - 1),
              }
            : r
        ),
      }));
    }
  },

  toggleShare: async (reelId, token) => {
    const { feedItems } = get();
    const reel = feedItems.find((r) => r.id === reelId);
    if (!reel) return;

    const wasShared = reel.isSharedByViewer;
    set((state) => ({
      feedItems: state.feedItems.map((r) =>
        r.id === reelId
          ? {
              ...r,
              isSharedByViewer: !wasShared,
              sharesCount: wasShared
                ? Math.max(0, r.sharesCount - 1)
                : r.sharesCount + 1,
            }
          : r
      ),
    }));

    try {
      if (wasShared) {
        await ReelsService.unshareReel(reelId, token);
      } else {
        await ReelsService.shareReel(reelId, token);
      }
    } catch {
      set((state) => ({
        feedItems: state.feedItems.map((r) =>
          r.id === reelId
            ? {
                ...r,
                isSharedByViewer: wasShared,
                sharesCount: wasShared
                  ? r.sharesCount + 1
                  : Math.max(0, r.sharesCount - 1),
              }
            : r
        ),
      }));
    }
  },

  addComment: async (reelId, comment, token, optimisticComment) => {
    // Optimistic update
    set((state) => ({
      comments: [...state.comments, optimisticComment],
      feedItems: state.feedItems.map((r) =>
        r.id === reelId
          ? { ...r, commentsCount: r.commentsCount + 1 }
          : r
      ),
    }));

    try {
      // Fire-and-confirm (do not rely on response body)
      await ReelsService.commentOnReel(reelId, comment, token);

      // Re-sync list from GET so IDs/timestamps are correct
      const serverComments = await ReelsService.getReelComments(reelId, token);
      set((state) => ({
        comments: serverComments,
        feedItems: state.feedItems.map((r) =>
          r.id === reelId
            ? { ...r, commentsCount: serverComments.length }
            : r
        ),
      }));
      return serverComments;
    } catch (error) {
      // Revert optimistic insert
      set((state) => ({
        comments: state.comments.filter((c) => c.id !== optimisticComment.id),
        feedItems: state.feedItems.map((r) =>
          r.id === reelId
            ? { ...r, commentsCount: Math.max(0, r.commentsCount - 1) }
            : r
        ),
        error:
          error instanceof Error ? error.message : "Failed to add comment",
      }));
      return null;
    }
  },

  deleteComment: async (reelId, commentId, token) => {
    const { comments: prevComments, feedItems: prevFeedItems } = get();

    // Optimistic update
    set((state) => ({
      comments: state.comments.filter((c) => c.id !== commentId),
      feedItems: state.feedItems.map((r) =>
        r.id === reelId
          ? { ...r, commentsCount: Math.max(0, r.commentsCount - 1) }
          : r
      ),
      error: null,
    }));

    try {
      await ReelsService.deleteReelComment(reelId, commentId, token);

      const serverComments = await ReelsService.getReelComments(reelId, token);
      set((state) => ({
        comments: serverComments,
        feedItems: state.feedItems.map((r) =>
          r.id === reelId
            ? { ...r, commentsCount: serverComments.length }
            : r
        ),
      }));

      return serverComments;
    } catch (error) {
      // Revert
      set({
        comments: prevComments,
        feedItems: prevFeedItems,
        error:
          error instanceof Error ? error.message : "Failed to delete comment",
      });
      return null;
    }
  },

  // ─── Management ───────────────────────────────────────────

  deleteReel: async (reelId, token) => {
    try {
      await ReelsService.deleteReel(reelId, token);
      set((state) => ({
        feedItems: state.feedItems.filter((r) => r.id !== reelId),
        myProfile: state.myProfile
          ? {
              ...state.myProfile,
              uploadedReels: state.myProfile.uploadedReels.filter(
                (r) => r.id !== reelId
              ),
            }
          : null,
      }));
      return true;
    } catch {
      return false;
    }
  },

  // ─── Utility ──────────────────────────────────────────────

  setActiveReel: (reel) => set({ activeReel: reel, comments: [] }),
  clearError: () => set({ error: null }),
}));

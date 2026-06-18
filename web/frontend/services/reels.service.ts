import axios from "axios";
import type {
  StudentProfile,
  AdminStudentProfile,
  UpdateProfilePayload,
  Reel,
  ReelFeedResponse,
  CreateReelPayload,
  UploadVideoResponse,
  LikeResponse,
  ShareResponse,
  ReelComment,
  ReelLike,
  FollowResponse,
  FollowEntry,
  ReelReport,
  AdminReelListResponse,
  FlagReelResponse,
  ReelFeedTab,
  ReelFeedOrderBy,
  SearchProfileResult,
} from "@/types/reelTypes";

function normalizeReelComment(raw: any): ReelComment {
  // New shape (GET /reels/:id/comments)
  if (raw?.student) {
    return {
      id: String(raw.id),
      comment: String(raw.comment ?? ""),
      createdAt: String(raw.createdAt),
      updatedAt: String(raw.updatedAt ?? raw.createdAt),
      student: {
        userId: String(raw.student.userId),
        displayName: String(raw.student.displayName ?? ""),
        profilePhotoUrl: String(raw.student.profilePhotoUrl ?? ""),
        status: raw.student.status ?? "ACTIVE",
      },
    };
  }

  // Legacy shape (older POST response)
  return {
    id: String(raw?.id),
    comment: String(raw?.comment ?? ""),
    createdAt: String(raw?.createdAt),
    updatedAt: String(raw?.updatedAt ?? raw?.createdAt),
    student: {
      userId: String(raw?.userId ?? ""),
      displayName: String(raw?.displayName ?? ""),
      profilePhotoUrl: String(raw?.profilePhotoUrl ?? ""),
      status: "ACTIVE",
    },
  };
}

const reelsAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_GATEWAY_URL,
  timeout: 25000,
});

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

// ─── Profile APIs ───────────────────────────────────────────

export const ReelsService = {
  // Get my profile
  async getMyProfile(token: string): Promise<StudentProfile> {
    const response = await reelsAxios.get<StudentProfile>("/reels/profile/me", {
      headers: authHeaders(token),
    });
    return response.data;
  },

  // Update my profile
  async updateMyProfile(
    payload: UpdateProfilePayload,
    token: string
  ): Promise<StudentProfile> {
    const response = await reelsAxios.patch<StudentProfile>(
      "/reels/profile/me",
      payload,
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  // Upload profile image
  async uploadProfileImage(file: File, token: string) {
    const formData = new FormData();
    formData.append("image", file);

    const response = await reelsAxios.post<{
      imageUrl: string;
      fileName: string;
    }>("/tenants/upload-image", formData, {
      headers: {
        ...authHeaders(token),
      },
    });

    return response.data;
  },

  // Get student profile by ID
  async getStudentProfile(
    studentId: string,
    token: string
  ): Promise<StudentProfile> {
    const response = await reelsAxios.get<StudentProfile>(
      `/reels/profile/${encodeURIComponent(studentId)}`,
      {
        headers: authHeaders(token),
      }
    );
    return response.data;
  },

  // ─── Following APIs ─────────────────────────────────────────

  async followStudent(
    studentId: string,
    token: string
  ): Promise<FollowResponse> {
    const response = await reelsAxios.post<FollowResponse>(
      `/reels/profile/${encodeURIComponent(studentId)}/follow`,
      {},
      {
        headers: authHeaders(token),
      }
    );
    return response.data;
  },

  async unfollowStudent(
    studentId: string,
    token: string
  ): Promise<FollowResponse> {
    const response = await reelsAxios.delete<FollowResponse>(
      `/reels/profile/${encodeURIComponent(studentId)}/follow`,
      {
        headers: authHeaders(token),
      }
    );
    return response.data;
  },

  async getFollowers(
    studentId: string,
    token: string
  ): Promise<FollowEntry[]> {
    const response = await reelsAxios.get<FollowEntry[]>(
      `/reels/profile/${encodeURIComponent(studentId)}/followers`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  async getFollowing(
    studentId: string,
    token: string
  ): Promise<FollowEntry[]> {
    const response = await reelsAxios.get<FollowEntry[]>(
      `/reels/profile/${encodeURIComponent(studentId)}/following`,
      { headers: authHeaders(token) }
    );
    return response.data;
  },

  // ─── Profile Search ─────────────────────────────────────────

  async searchProfiles(
    q: string,
    token: string,
    limit?: number
  ): Promise<SearchProfileResult[]> {
    const params: Record<string, string | number> = { q };
    if (limit !== undefined) params.limit = limit;
    const response = await reelsAxios.get<SearchProfileResult[]>(
      "/reels/profiles/search",
      { headers: authHeaders(token), params }
    );
    return response.data;
  },

  // ─── Video Upload ───────────────────────────────────────────

  async uploadVideo(
    file: File,
    token: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadVideoResponse> {
    const formData = new FormData();
    formData.append("video", file);

    const response = await reelsAxios.post<UploadVideoResponse>(
      "/reels/upload-video",
      formData,
      {
        headers: {
          ...authHeaders(token),
        },
        timeout: 120000, // 2 min for large uploads
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percent);
          }
        },
      }
    );
    return response.data;
  },

  // ─── Reel CRUD ──────────────────────────────────────────────

  async createReel(
    payload: CreateReelPayload,
    token: string
  ): Promise<Reel> {
    const response = await reelsAxios.post<Reel>("/reels", payload, {
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json",
      },
    });
    return response.data;
  },

  async getReelById(reelId: string, token: string): Promise<Reel> {
    const response = await reelsAxios.get<Reel>(
      `/reels/${encodeURIComponent(reelId)}`,
      {
        headers: authHeaders(token),
      }
    );
    return response.data;
  },

  async getFeed(
    token: string,
    params?: {
      tab?: ReelFeedTab;
      orderBy?: ReelFeedOrderBy;
      limit?: number;
      cursorCreatedAt?: string;
    }
  ): Promise<ReelFeedResponse> {
    const response = await reelsAxios.get<ReelFeedResponse>("/reels/feed", {
      headers: authHeaders(token),
      params,
    });
    return response.data;
  },

  async deleteReel(
    reelId: string,
    token: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await reelsAxios.delete(
      `/reels/${encodeURIComponent(reelId)}`,
      {
        headers: authHeaders(token),
      }
    );
    return response.data;
  },

  // ─── Interactions ───────────────────────────────────────────

  async likeReel(reelId: string, token: string): Promise<LikeResponse> {
    const response = await reelsAxios.post<LikeResponse>(
      `/reels/${encodeURIComponent(reelId)}/like`,
      {},
      {
        headers: authHeaders(token),
      }
    );
    return response.data;
  },

  async unlikeReel(reelId: string, token: string): Promise<LikeResponse> {
    const response = await reelsAxios.delete<LikeResponse>(
      `/reels/${encodeURIComponent(reelId)}/like`,
      {
        headers: authHeaders(token),
      }
    );
    return response.data;
  },

  async commentOnReel(
    reelId: string,
    comment: string,
    token: string
  ): Promise<void> {
    await reelsAxios.post(
      `/reels/${encodeURIComponent(reelId)}/comments`,
      { comment },
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );
  },

  async getReelComments(reelId: string, token: string): Promise<ReelComment[]> {
    const response = await reelsAxios.get<unknown>(
      `/reels/${encodeURIComponent(reelId)}/comments`,
      {
        headers: authHeaders(token),
      }
    );
    const data = response.data;
    if (!Array.isArray(data)) return [];
    return data.map(normalizeReelComment);
  },

  async getReelLikes(reelId: string, token: string): Promise<ReelLike[]> {
    const response = await reelsAxios.get<ReelLike[]>(
      `/reels/${encodeURIComponent(reelId)}/likes`,
      {
        headers: authHeaders(token),
      }
    );
    return response.data;
  },

  async deleteReelComment(
    reelId: string,
    commentId: string,
    token: string
  ): Promise<{ success: boolean; commentId: string }> {
    const response = await reelsAxios.delete<{ success: boolean; commentId: string }>(
      `/reels/${encodeURIComponent(reelId)}/comments/${encodeURIComponent(
        commentId
      )}`,
      {
        headers: authHeaders(token),
      }
    );
    return response.data;
  },

  async shareReel(reelId: string, token: string): Promise<ShareResponse> {
    const response = await reelsAxios.post<ShareResponse>(
      `/reels/${encodeURIComponent(reelId)}/share`,
      {},
      {
        headers: authHeaders(token),
      }
    );
    return response.data;
  },

  async unshareReel(reelId: string, token: string): Promise<ShareResponse> {
    const response = await reelsAxios.delete<ShareResponse>(
      `/reels/${encodeURIComponent(reelId)}/share`,
      {
        headers: authHeaders(token),
      }
    );
    return response.data;
  },

  async reportReel(
    reelId: string,
    reason: string,
    details: string,
    token: string
  ): Promise<ReelReport> {
    const response = await reelsAxios.post<ReelReport>(
      `/reels/${encodeURIComponent(reelId)}/report`,
      { reason, details },
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },
};

// ─── Admin APIs ─────────────────────────────────────────────

export const ReelsAdminService = {
  async listReels(
    token: string,
    params?: { flaggedOnly?: boolean; limit?: number }
  ): Promise<AdminReelListResponse> {
    const response = await reelsAxios.get<AdminReelListResponse>(
      "/reels/admin/all",
      {
        headers: authHeaders(token),
        params,
      }
    );
    return response.data;
  },

  async flagReel(
    reelId: string,
    isFlagged: boolean,
    token: string
  ): Promise<FlagReelResponse> {
    const response = await reelsAxios.patch<FlagReelResponse>(
      `/reels/admin/${encodeURIComponent(reelId)}/flag`,
      { isFlagged },
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  async deleteReel(
    reelId: string,
    token: string
  ): Promise<{ success: boolean; message: string; deletedReelId: string }> {
    const response = await reelsAxios.delete(
      `/reels/admin/${encodeURIComponent(reelId)}`,
      {
        headers: authHeaders(token),
      }
    );
    return response.data;
  },

  async updateStudentStatus(
    studentId: string,
    status: string,
    token: string
  ): Promise<StudentProfile> {
    const response = await reelsAxios.patch<StudentProfile>(
      `/reels/admin/profile/${encodeURIComponent(studentId)}/status`,
      { status },
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  async listStudentProfiles(
    token: string,
    params?: { status?: "ACTIVE" | "BANNED"; limit?: number }
  ): Promise<AdminStudentProfile[]> {
    const response = await reelsAxios.get<AdminStudentProfile[]>(
      "/reels/admin/profiles",
      {
        headers: authHeaders(token),
        params,
      }
    );
    return response.data;
  },

  async listReports(token: string): Promise<ReelReport[]> {
    const response = await reelsAxios.get<ReelReport[]>("/reels/admin/reports", {
      headers: authHeaders(token),
    });
    return response.data;
  },

  async updateReportStatus(
    reportId: string,
    status: "PENDING" | "REVIEWED",
    token: string
  ): Promise<ReelReport> {
    const response = await reelsAxios.patch<ReelReport>(
      `/reels/admin/reports/${encodeURIComponent(reportId)}/status`,
      { status },
      {
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  },

  async deleteReport(reportId: string, token: string): Promise<void> {
    await reelsAxios.delete(
      `/reels/admin/reports/${encodeURIComponent(reportId)}`,
      { headers: authHeaders(token) }
    );
  },
};

// Reels Feature Types

export type StudentProfileStatus =
  | "ACTIVELY_MOVING"
  | "COMPLETED_MOVE"
  | "INACTIVE"
  | "ACTIVE"
  | "BANNED";

export interface AdminStudentProfile {
  id: string;
  userId: string;
  displayName: string;
  profilePhotoUrl: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  status: StudentProfileStatus;
  createdAt: string;
  updatedAt: string;
}

export type ReelFeedTab = "all" | "followers";

export type ReelFeedOrderBy = "chronological" | "popularity";

export interface ReelCreator {
  userId: string;
  displayName: string;
  profilePhotoUrl: string;
  status: StudentProfileStatus;
}

export interface Reel {
  id: string;
  videoUrl: string;
  durationSeconds: number;
  wasTrimmed: boolean;
  caption: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  popularityScore: number;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
  creator: ReelCreator;
  isLikedByViewer: boolean;
  isSharedByViewer: boolean;
}

export interface StudentProfile {
  userId: string;
  displayName: string;
  profilePhotoUrl: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  status: StudentProfileStatus;
  isFollowedByViewer: boolean;
  uploadedReels: Reel[];
  sharedReels: Reel[];
}

export interface UpdateProfilePayload {
  displayName?: string;
  profilePhotoUrl?: string;
  bio?: string;
}

export interface ReelFeedResponse {
  items: Reel[];
  nextCursorCreatedAt: string | null;
}

export interface CreateReelPayload {
  videoUrl: string;
  durationSeconds: number;
  caption?: string;
  tags?: string[];
}

export interface UploadVideoResponse {
  videoUrl: string;
  durationSeconds: number;
}

export interface LikeResponse {
  likesCount: number;
  isLikedByViewer: boolean;
}

export interface ShareResponse {
  sharesCount: number;
  isSharedByViewer: boolean;
}

export interface ReelComment {
  id: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
  student: ReelCreator;
}

export interface ReelLike {
  id: string;
  createdAt: string;
  student: ReelCreator;
}

export interface FollowResponse {
  userId: string;
  followingCount: number;
}

export type ReelReportStatus = "PENDING" | "REVIEWED";

export interface ReelReport {
  id: string;
  reelId: string;
  reason: string;
  details: string;
  status: ReelReportStatus;
  createdAt: string;
  student: {
    userId: string;
    displayName: string;
    profilePhotoUrl: string;
    status: StudentProfileStatus;
  };
}

export type AdminReelListResponse = Reel[] | {
  items: Reel[];
  totalCount: number;
  hasMore: boolean;
};

export interface FlagReelResponse {
  id: string;
  isFlagged: boolean;
  flaggedAt: string;
  flaggedBy: string;
}

export interface FollowEntry {
  userId: string;
  displayName: string;
  profilePhotoUrl: string;
  status: StudentProfileStatus;
  followedAt: string;
}

export interface SearchProfileResult {
  userId: string;
  displayName: string;
  profilePhotoUrl: string | null;
  followersCount: number;
  followingCount: number;
  status: StudentProfileStatus;
}

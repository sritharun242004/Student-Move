import { StudentProfileStatus } from '../domain/entities/student-profile.entity';

export type ReelFeedTab = 'all' | 'followers';
export type ReelFeedOrderBy = 'chronological' | 'popularity';

export interface UpdateStudentProfileDto {
  displayName?: string;
  profilePhotoUrl?: string;
  bio?: string;
}

export interface UpdateStudentStatusDto {
  status: StudentProfileStatus;
}

export interface CreateReelDto {
  videoUrl: string;
  durationSeconds: number;
  caption?: string;
  tags?: string[];
}

export interface GetReelFeedDto {
  tab?: ReelFeedTab;
  orderBy?: ReelFeedOrderBy;
  limit?: number;
  cursorCreatedAt?: string;
}

export interface CommentOnReelDto {
  comment: string;
}

export interface ReportReelDto {
  reason: string;
  details?: string;
}

export interface FlagReelDto {
  isFlagged: boolean;
}

export interface AdminListReelsDto {
  flaggedOnly?: boolean;
  limit?: number;
}

export interface AdminListStudentProfilesDto {
  status?: StudentProfileStatus;
  limit?: number;
}

export interface SearchStudentProfilesDto {
  q: string;
  limit?: number;
}

export interface SearchProfileResult {
  userId: string;
  displayName: string;
  profilePhotoUrl?: string;
  followersCount: number;
  status: StudentProfileStatus;
}

export interface AdminStudentProfileView {
  id: string;
  userId: string;
  displayName: string;
  profilePhotoUrl?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  status: StudentProfileStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReelCreatorView {
  userId: string;
  displayName: string;
  profilePhotoUrl?: string;
  status: StudentProfileStatus;
}

export interface ReelView {
  id: string;
  videoUrl: string;
  durationSeconds: number;
  wasTrimmed: boolean;
  caption?: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  popularityScore: number;
  isFlagged: boolean;
  createdAt: Date;
  updatedAt: Date;
  creator: ReelCreatorView;
  isLikedByViewer: boolean;
  isSharedByViewer: boolean;
}

export interface StudentProfileView {
  userId: string;
  displayName: string;
  profilePhotoUrl?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  status: StudentProfileStatus;
  isFollowedByViewer: boolean;
  uploadedReels: ReelView[];
  sharedReels: ReelView[];
}

export interface ReelFeedView {
  items: ReelView[];
  nextCursorCreatedAt: string | null;
}

export interface ReelCommentView {
  id: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  student: ReelCreatorView;
}

export interface ReelLikeView {
  id: string;
  createdAt: Date;
  student: ReelCreatorView;
}

export interface StudentFollowView {
  userId: string;
  displayName: string;
  profilePhotoUrl?: string;
  status: import('../domain/entities/student-profile.entity').StudentProfileStatus;
  followedAt: Date;
}

export interface ReelReportView {
  id: string;
  reelId: string;
  reason: string;
  details?: string;
  status: import('../domain/entities/reel-report.entity').ReelReportStatus;
  createdAt: Date;
  student: ReelCreatorView;
}

export interface UpdateReportStatusDto {
  status: import('../domain/entities/reel-report.entity').ReelReportStatus;
}

export interface MainAuthProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

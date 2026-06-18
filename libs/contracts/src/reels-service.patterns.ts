export const REELS_SERVICE_PATTERNS = {
  healthPing: 'reels.health.ping',

  profileGetMe: 'reels.profile.getMe',
  profileUpdateMe: 'reels.profile.updateMe',
  profileGetByStudentId: 'reels.profile.getByStudentId',
  profileFollow: 'reels.profile.follow',
  profileUnfollow: 'reels.profile.unfollow',
  profileUpdateStatus: 'reels.profile.updateStatus',
  profileGetFollowers: 'reels.profile.getFollowers',
  profileGetFollowing: 'reels.profile.getFollowing',
  profileSearch: 'reels.profile.search',
  profileAdminList: 'reels.profile.admin.list',

  reelCreate: 'reels.reel.create',
  reelGetById: 'reels.reel.getById',
  reelDelete: 'reels.reel.delete',
  reelGetFeed: 'reels.reel.getFeed',
  reelLike: 'reels.reel.like',
  reelUnlike: 'reels.reel.unlike',
  reelComment: 'reels.reel.comment',
  reelShare: 'reels.reel.share',
  reelUnshare: 'reels.reel.unshare',
  reelReport: 'reels.reel.report',
  reelAdminList: 'reels.reel.admin.list',
  reelAdminFlag: 'reels.reel.admin.flag',
  reelAdminDelete: 'reels.reel.admin.delete',
  reelGetComments: 'reels.reel.getComments',
  reelGetLikes: 'reels.reel.getLikes',
  reelDeleteComment: 'reels.reel.deleteComment',
  reelAdminListReports: 'reels.reel.admin.listReports',
  reelAdminUpdateReportStatus: 'reels.reel.admin.updateReportStatus',
  reelAdminDeleteReport: 'reels.reel.admin.deleteReport',
} as const;

export interface StudentByIdPayload {
  studentId: string;
  viewerId?: string;
}

export interface FollowPayload {
  userId: string;
  studentId: string;
}

export interface StudentStatusPayload<T = unknown> {
  studentId: string;
  body?: T;
}

export interface ReelByIdPayload {
  reelId: string;
  userId?: string;
}

export interface ReelActionPayload<T = unknown> {
  userId: string;
  reelId: string;
  body?: T;
}

export interface ReelAdminActionPayload<T = unknown> {
  reelId: string;
  body?: T;
}

export interface DeleteCommentPayload {
  reelId: string;
  commentId: string;
  userId: string;
  isAdmin: boolean;
}

export interface ProfileFollowListPayload {
  studentId: string;
}

export interface SearchProfilesPayload {
  q: string;
  limit?: number;
}

export interface UpdateReportStatusPayload {
  reportId: string;
  status: string;
}

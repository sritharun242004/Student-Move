import { Injectable } from '@nestjs/common';
import { ReelsServiceClient } from '../../microservices/reels-service.client';
import { ReelsVideoUploadService } from './reels-video-upload.service';

@Injectable()
export class ReelsGatewayService {
  constructor(
    private readonly reelsClient: ReelsServiceClient,
    private readonly reelsVideoUploadService: ReelsVideoUploadService,
  ) {}

  getMyProfile(userId: string) {
    return this.reelsClient.getMyProfile({ userId });
  }

  updateMyProfile(userId: string, body: Record<string, unknown>) {
    return this.reelsClient.updateMyProfile({ userId, body });
  }

  getProfileByStudentId(studentId: string, viewerId?: string) {
    return this.reelsClient.getProfileByStudentId({ studentId, viewerId });
  }

  followStudent(userId: string, studentId: string) {
    return this.reelsClient.followStudent({ userId, studentId });
  }

  unfollowStudent(userId: string, studentId: string) {
    return this.reelsClient.unfollowStudent({ userId, studentId });
  }

  updateStudentStatus(studentId: string, body: Record<string, unknown>) {
    return this.reelsClient.updateStudentStatus({ studentId, body });
  }

  searchProfiles(q: string, limit?: number) {
    return this.reelsClient.searchProfiles({ q, limit });
  }

  listAdminStudentProfiles(query: Record<string, unknown>) {
    const limitRaw = query.limit;
    const limit =
      typeof limitRaw === 'string' && limitRaw.trim() !== ''
        ? Number(limitRaw)
        : typeof limitRaw === 'number'
          ? limitRaw
          : undefined;

    return this.reelsClient.listAdminStudentProfiles({
      status: query.status,
      limit,
    });
  }

  createReel(userId: string, body: Record<string, unknown>) {
    return this.reelsClient.createReel({ userId, body });
  }

  uploadVideo(userId: string, file: Express.Multer.File) {
    return this.reelsVideoUploadService.optimizeAndUpload(userId, file);
  }

  getReelById(reelId: string, userId?: string) {
    return this.reelsClient.getReelById({ reelId, userId });
  }

  deleteMyReel(userId: string, reelId: string) {
    return this.reelsClient.deleteMyReel({ userId, reelId });
  }

  getFeed(userId: string | undefined, query: Record<string, unknown>) {
    const limitRaw = query.limit;
    const limit =
      typeof limitRaw === 'string' && limitRaw.trim() !== ''
        ? Number(limitRaw)
        : typeof limitRaw === 'number'
          ? limitRaw
          : undefined;

    return this.reelsClient.getFeed({
      userId,
      body: {
        tab: query.tab,
        orderBy: query.orderBy,
        limit,
        cursorCreatedAt: query.cursorCreatedAt,
      },
    });
  }

  likeReel(userId: string, reelId: string) {
    return this.reelsClient.likeReel({ userId, reelId });
  }

  unlikeReel(userId: string, reelId: string) {
    return this.reelsClient.unlikeReel({ userId, reelId });
  }

  commentOnReel(userId: string, reelId: string, body: Record<string, unknown>) {
    return this.reelsClient.commentOnReel({ userId, reelId, body });
  }

  shareReel(userId: string, reelId: string) {
    return this.reelsClient.shareReel({ userId, reelId });
  }

  unshareReel(userId: string, reelId: string) {
    return this.reelsClient.unshareReel({ userId, reelId });
  }

  reportReel(userId: string, reelId: string, body: Record<string, unknown>) {
    return this.reelsClient.reportReel({ userId, reelId, body });
  }

  listAdminReels(query: Record<string, unknown>) {
    const flaggedOnlyValue = query.flaggedOnly;
    const flaggedOnly =
      flaggedOnlyValue === true ||
      flaggedOnlyValue === 'true' ||
      flaggedOnlyValue === '1';

    const limitRaw = query.limit;
    const limit =
      typeof limitRaw === 'string' && limitRaw.trim() !== ''
        ? Number(limitRaw)
        : typeof limitRaw === 'number'
          ? limitRaw
          : undefined;

    return this.reelsClient.listAdminReels({
      flaggedOnly,
      limit,
    });
  }

  flagReel(reelId: string, body: Record<string, unknown>) {
    return this.reelsClient.flagReel({ reelId, body });
  }

  adminDeleteReel(reelId: string) {
    return this.reelsClient.adminDeleteReel({ reelId });
  }

  getReelComments(reelId: string) {
    return this.reelsClient.getReelComments({ reelId });
  }

  getReelLikes(reelId: string) {
    return this.reelsClient.getReelLikes({ reelId });
  }

  deleteComment(userId: string, reelId: string, commentId: string, isAdmin: boolean) {
    return this.reelsClient.deleteComment({ userId, reelId, commentId, isAdmin });
  }

  getFollowers(studentId: string) {
    return this.reelsClient.getFollowers({ studentId });
  }

  getFollowing(studentId: string) {
    return this.reelsClient.getFollowing({ studentId });
  }

  listAdminReports() {
    return this.reelsClient.listAdminReports();
  }

  updateReportStatus(reportId: string, status: string) {
    return this.reelsClient.updateReportStatus({ reportId, status });
  }

  deleteReport(reportId: string) {
    return this.reelsClient.deleteReport(reportId);
  }
}

import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  REELS_SERVICE_PATTERNS,
} from '@app/contracts';
import type {
  DeleteCommentPayload,
  FollowPayload,
  ProfileFollowListPayload,
  ReelActionPayload,
  ReelAdminActionPayload,
  ReelByIdPayload,
  StudentByIdPayload,
  StudentStatusPayload,
  UpdateReportStatusPayload,
  UserScopedPayload,
  SearchProfilesPayload,
} from '@app/contracts';
import type {
  AdminListReelsDto,
  AdminListStudentProfilesDto,
  CommentOnReelDto,
  SearchStudentProfilesDto,
  CreateReelDto,
  FlagReelDto,
  GetReelFeedDto,
  ReportReelDto,
  UpdateStudentProfileDto,
  UpdateStudentStatusDto,
} from './reels.dto';
import { ReelsService } from './reels.service';

@Controller()
export class ReelsRpcController {
  constructor(private readonly reelsService: ReelsService) {}

  @MessagePattern(REELS_SERVICE_PATTERNS.profileGetMe)
  getMyProfile(@Payload() payload: UserScopedPayload) {
    return this.reelsService.getMyProfile(payload.userId);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.profileUpdateMe)
  updateMyProfile(@Payload() payload: UserScopedPayload<UpdateStudentProfileDto>) {
    return this.reelsService.updateMyProfile(payload.userId, payload.body ?? {});
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.profileGetByStudentId)
  getProfileByStudentId(@Payload() payload: StudentByIdPayload) {
    return this.reelsService.getStudentProfileByUserId(payload.studentId, payload.viewerId);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.profileFollow)
  followStudent(@Payload() payload: FollowPayload) {
    return this.reelsService.followStudent(payload.userId, payload.studentId);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.profileUnfollow)
  unfollowStudent(@Payload() payload: FollowPayload) {
    return this.reelsService.unfollowStudent(payload.userId, payload.studentId);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.profileUpdateStatus)
  updateStudentStatus(@Payload() payload: StudentStatusPayload<UpdateStudentStatusDto>) {
    return this.reelsService.updateStudentStatus(payload.studentId, payload.body as UpdateStudentStatusDto);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelCreate)
  createReel(@Payload() payload: UserScopedPayload<CreateReelDto>) {
    return this.reelsService.createReel(payload.userId, payload.body as CreateReelDto);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelGetById)
  getReelById(@Payload() payload: ReelByIdPayload) {
    return this.reelsService.getReelById(payload.reelId, payload.userId);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelDelete)
  deleteMyReel(@Payload() payload: ReelActionPayload) {
    return this.reelsService.deleteReel(payload.userId, payload.reelId);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelGetFeed)
  getFeed(@Payload() payload: { userId?: string; body?: GetReelFeedDto }) {
    return this.reelsService.getFeed(payload.userId, payload.body ?? {});
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelLike)
  likeReel(@Payload() payload: ReelActionPayload) {
    return this.reelsService.likeReel(payload.userId, payload.reelId);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelUnlike)
  unlikeReel(@Payload() payload: ReelActionPayload) {
    return this.reelsService.unlikeReel(payload.userId, payload.reelId);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelComment)
  commentOnReel(@Payload() payload: ReelActionPayload<CommentOnReelDto>) {
    return this.reelsService.commentOnReel(payload.userId, payload.reelId, payload.body as CommentOnReelDto);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelShare)
  shareReel(@Payload() payload: ReelActionPayload) {
    return this.reelsService.shareReel(payload.userId, payload.reelId);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelUnshare)
  unshareReel(@Payload() payload: ReelActionPayload) {
    return this.reelsService.unshareReel(payload.userId, payload.reelId);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelReport)
  reportReel(@Payload() payload: ReelActionPayload<ReportReelDto>) {
    return this.reelsService.reportReel(payload.userId, payload.reelId, payload.body as ReportReelDto);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelAdminList)
  listAdminReels(@Payload() payload?: AdminListReelsDto) {
    return this.reelsService.listAdminReels(payload ?? {});
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.profileAdminList)
  listAdminStudentProfiles(@Payload() payload?: AdminListStudentProfilesDto) {
    return this.reelsService.listAdminStudentProfiles(payload ?? {});
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.profileSearch)
  searchProfiles(@Payload() payload: SearchProfilesPayload) {
    return this.reelsService.searchProfiles(payload);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelAdminFlag)
  flagReel(@Payload() payload: ReelAdminActionPayload<FlagReelDto>) {
    return this.reelsService.flagReel(payload.reelId, payload.body as FlagReelDto);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelAdminDelete)
  adminDeleteReel(@Payload() payload: ReelAdminActionPayload) {
    return this.reelsService.adminDeleteReel(payload.reelId);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelGetComments)
  getReelComments(@Payload() payload: ReelByIdPayload) {
    return this.reelsService.getReelComments(payload.reelId);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelGetLikes)
  getReelLikes(@Payload() payload: ReelByIdPayload) {
    return this.reelsService.getReelLikes(payload.reelId);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelDeleteComment)
  deleteComment(@Payload() payload: DeleteCommentPayload) {
    return this.reelsService.deleteComment(
      payload.commentId,
      payload.reelId,
      payload.userId,
      payload.isAdmin,
    );
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.profileGetFollowers)
  getFollowers(@Payload() payload: ProfileFollowListPayload) {
    return this.reelsService.getFollowers(payload.studentId);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.profileGetFollowing)
  getFollowing(@Payload() payload: ProfileFollowListPayload) {
    return this.reelsService.getFollowing(payload.studentId);
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelAdminListReports)
  listAdminReports() {
    return this.reelsService.listAdminReports();
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelAdminUpdateReportStatus)
  updateReportStatus(@Payload() payload: UpdateReportStatusPayload) {
    return this.reelsService.updateReportStatus(payload.reportId, { status: payload.status as import('./reels.dto').UpdateReportStatusDto['status'] });
  }

  @MessagePattern(REELS_SERVICE_PATTERNS.reelAdminDeleteReport)
  deleteReport(@Payload() payload: { reportId: string }) {
    return this.reelsService.deleteReport(payload.reportId);
  }
}

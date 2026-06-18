import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  DeleteCommentPayload,
  FollowPayload,
  ProfileFollowListPayload,
  REELS_SERVICE_PATTERNS,
  ReelActionPayload,
  ReelAdminActionPayload,
  ReelByIdPayload,
  StudentByIdPayload,
  StudentStatusPayload,
  UpdateReportStatusPayload,
  UserScopedPayload,
} from '@app/contracts';
import { firstValueFrom } from 'rxjs';

export const REELS_SERVICE_CLIENT = 'REELS_SERVICE_CLIENT';

@Injectable()
export class ReelsServiceClient {
  constructor(
    @Inject(REELS_SERVICE_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  healthPing() {
    return this.send(REELS_SERVICE_PATTERNS.healthPing);
  }

  getMyProfile(payload: UserScopedPayload) {
    return this.send(REELS_SERVICE_PATTERNS.profileGetMe, payload);
  }

  updateMyProfile(payload: UserScopedPayload<Record<string, unknown>>) {
    return this.send(REELS_SERVICE_PATTERNS.profileUpdateMe, payload);
  }

  getProfileByStudentId(payload: StudentByIdPayload) {
    return this.send(REELS_SERVICE_PATTERNS.profileGetByStudentId, payload);
  }

  followStudent(payload: FollowPayload) {
    return this.send(REELS_SERVICE_PATTERNS.profileFollow, payload);
  }

  unfollowStudent(payload: FollowPayload) {
    return this.send(REELS_SERVICE_PATTERNS.profileUnfollow, payload);
  }

  updateStudentStatus(payload: StudentStatusPayload<Record<string, unknown>>) {
    return this.send(REELS_SERVICE_PATTERNS.profileUpdateStatus, payload);
  }

  createReel(payload: UserScopedPayload<Record<string, unknown>>) {
    return this.send(REELS_SERVICE_PATTERNS.reelCreate, payload);
  }

  getReelById(payload: ReelByIdPayload) {
    return this.send(REELS_SERVICE_PATTERNS.reelGetById, payload);
  }

  deleteMyReel(payload: ReelActionPayload) {
    return this.send(REELS_SERVICE_PATTERNS.reelDelete, payload);
  }

  getFeed(payload: { userId?: string; body?: Record<string, unknown> }) {
    return this.send(REELS_SERVICE_PATTERNS.reelGetFeed, payload);
  }

  likeReel(payload: ReelActionPayload) {
    return this.send(REELS_SERVICE_PATTERNS.reelLike, payload);
  }

  unlikeReel(payload: ReelActionPayload) {
    return this.send(REELS_SERVICE_PATTERNS.reelUnlike, payload);
  }

  commentOnReel(payload: ReelActionPayload<Record<string, unknown>>) {
    return this.send(REELS_SERVICE_PATTERNS.reelComment, payload);
  }

  shareReel(payload: ReelActionPayload) {
    return this.send(REELS_SERVICE_PATTERNS.reelShare, payload);
  }

  unshareReel(payload: ReelActionPayload) {
    return this.send(REELS_SERVICE_PATTERNS.reelUnshare, payload);
  }

  reportReel(payload: ReelActionPayload<Record<string, unknown>>) {
    return this.send(REELS_SERVICE_PATTERNS.reelReport, payload);
  }

  listAdminReels(payload: Record<string, unknown>) {
    return this.send(REELS_SERVICE_PATTERNS.reelAdminList, payload);
  }

  listAdminStudentProfiles(payload: Record<string, unknown>) {
    return this.send(REELS_SERVICE_PATTERNS.profileAdminList, payload);
  }

  searchProfiles(payload: { q: string; limit?: number }) {
    return this.send(REELS_SERVICE_PATTERNS.profileSearch, payload);
  }

  flagReel(payload: ReelAdminActionPayload<Record<string, unknown>>) {
    return this.send(REELS_SERVICE_PATTERNS.reelAdminFlag, payload);
  }

  adminDeleteReel(payload: ReelAdminActionPayload) {
    return this.send(REELS_SERVICE_PATTERNS.reelAdminDelete, payload);
  }

  getReelComments(payload: ReelByIdPayload) {
    return this.send(REELS_SERVICE_PATTERNS.reelGetComments, payload);
  }

  getReelLikes(payload: ReelByIdPayload) {
    return this.send(REELS_SERVICE_PATTERNS.reelGetLikes, payload);
  }

  deleteComment(payload: DeleteCommentPayload) {
    return this.send(REELS_SERVICE_PATTERNS.reelDeleteComment, payload);
  }

  getFollowers(payload: ProfileFollowListPayload) {
    return this.send(REELS_SERVICE_PATTERNS.profileGetFollowers, payload);
  }

  getFollowing(payload: ProfileFollowListPayload) {
    return this.send(REELS_SERVICE_PATTERNS.profileGetFollowing, payload);
  }

  listAdminReports() {
    return this.send(REELS_SERVICE_PATTERNS.reelAdminListReports);
  }

  updateReportStatus(payload: UpdateReportStatusPayload) {
    return this.send(REELS_SERVICE_PATTERNS.reelAdminUpdateReportStatus, payload);
  }

  deleteReport(reportId: string) {
    return this.send(REELS_SERVICE_PATTERNS.reelAdminDeleteReport, { reportId });
  }

  private send<TResult = unknown, TPayload = unknown>(
    pattern: string,
    payload?: TPayload,
  ): Promise<TResult> {
    const safePayload = (payload ?? ({} as TPayload)) as TPayload;

    return firstValueFrom(this.client.send<TResult, TPayload>(pattern, safePayload)).catch(
      (error: unknown) => {
        throw this.mapRpcErrorToHttpException(error);
      },
    );
  }

  private mapRpcErrorToHttpException(error: unknown): HttpException {
    if (error instanceof HttpException) {
      return error;
    }

    const raw = this.extractRpcErrorPayload(error);
    const statusCode = this.readStatusCode(raw);
    const message = this.readMessage(raw);

    if (statusCode) {
      return new HttpException({ statusCode, message }, statusCode);
    }

    return new BadGatewayException(message ?? 'Request to reels service failed');
  }

  private extractRpcErrorPayload(error: unknown): unknown {
    if (!error || typeof error !== 'object') {
      return error;
    }

    const record = error as Record<string, unknown>;
    return record.error ?? record.response ?? record;
  }

  private readStatusCode(payload: unknown): number | undefined {
    if (!payload || typeof payload !== 'object') {
      return undefined;
    }

    const statusCode = (payload as Record<string, unknown>).statusCode;
    if (typeof statusCode === 'number') {
      return statusCode;
    }

    const status = (payload as Record<string, unknown>).status;
    if (typeof status === 'number') {
      return status;
    }

    return undefined;
  }

  private readMessage(payload: unknown): string | string[] {
    if (!payload || typeof payload !== 'object') {
      return 'Internal server error';
    }

    const message = (payload as Record<string, unknown>).message;

    if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
      return message;
    }

    if (typeof message === 'string') {
      return message;
    }

    return 'Internal server error';
  }
}

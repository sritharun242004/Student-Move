import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityTarget,
  EntityManager,
  ILike,
  In,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { NotificationService } from '@app/notifications';
import { ReelComment } from '../domain/entities/reel-comment.entity';
import { ReelLike } from '../domain/entities/reel-like.entity';
import { ReelReport, ReelReportStatus } from '../domain/entities/reel-report.entity';
import { ReelShare } from '../domain/entities/reel-share.entity';
import { Reel } from '../domain/entities/reel.entity';
import {
  StudentFollow,
} from '../domain/entities/student-follow.entity';
import {
  StudentProfile,
  StudentProfileStatus,
} from '../domain/entities/student-profile.entity';
import {
  AdminListReelsDto,
  AdminListStudentProfilesDto,
  AdminStudentProfileView,
  CommentOnReelDto,
  SearchStudentProfilesDto,
  SearchProfileResult,
  CreateReelDto,
  FlagReelDto,
  GetReelFeedDto,
  MainAuthProfileResponse,
  ReelCommentView,
  ReelFeedView,
  ReelLikeView,
  ReelReportView,
  ReelView,
  ReportReelDto,
  StudentFollowView,
  StudentProfileView,
  UpdateReportStatusDto,
  UpdateStudentProfileDto,
  UpdateStudentStatusDto,
} from './reels.dto';

const DEFAULT_FEED_LIMIT = 20;
const MAX_FEED_LIMIT = 50;

@Injectable()
export class ReelsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(StudentProfile)
    private readonly studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(Reel)
    private readonly reelRepository: Repository<Reel>,
    @InjectRepository(StudentFollow)
    private readonly followRepository: Repository<StudentFollow>,
    @InjectRepository(ReelLike)
    private readonly likeRepository: Repository<ReelLike>,
    @InjectRepository(ReelComment)
    private readonly commentRepository: Repository<ReelComment>,
    @InjectRepository(ReelShare)
    private readonly shareRepository: Repository<ReelShare>,
    @InjectRepository(ReelReport)
    private readonly reportRepository: Repository<ReelReport>,
    private readonly notificationService: NotificationService,
  ) {}

  async getMyProfile(userId: string): Promise<StudentProfileView> {
    const viewer = await this.ensureStudentProfile(userId);
    return this.getStudentProfileByUserId(userId, viewer.userId);
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateStudentProfileDto,
  ): Promise<StudentProfileView> {
    const profile = await this.ensureStudentProfile(userId);

    if (dto.displayName !== undefined) {
      const displayName = dto.displayName.trim();
      if (!displayName) {
        throw new BadRequestException('displayName cannot be empty');
      }
      if (displayName.length > 200) {
        throw new BadRequestException('displayName must be less than 200 characters');
      }
      profile.displayName = displayName;
    }

    if (dto.bio !== undefined) {
      const bio = dto.bio.trim();
      if (bio.length > 500) {
        throw new BadRequestException('bio must be less than 500 characters');
      }
      profile.bio = bio || undefined;
    }

    if (dto.profilePhotoUrl !== undefined) {
      const photoUrl = dto.profilePhotoUrl.trim();
      if (photoUrl && !this.isValidHttpUrl(photoUrl)) {
        throw new BadRequestException('profilePhotoUrl must be a valid URL');
      }
      profile.profilePhotoUrl = photoUrl || undefined;
    }

    await this.studentProfileRepository.save(profile);
    return this.getStudentProfileByUserId(userId, userId);
  }

  async getStudentProfileByUserId(
    studentId: string,
    viewerId?: string,
  ): Promise<StudentProfileView> {
    const profile = await this.ensureStudentProfile(studentId);
    const viewer = viewerId ? await this.ensureStudentProfile(viewerId) : undefined;

    return this.buildProfileView(profile, viewer?.id);
  }

  async followStudent(userId: string, studentId: string): Promise<{ success: boolean }> {
    const isNewFollow = await this.dataSource.transaction(async (manager) => {
      const follower = await this.requireActiveStudentProfile(userId, manager);
      const following = await this.ensureStudentProfile(studentId, manager);

      if (follower.id === following.id) {
        throw new BadRequestException('You cannot follow your own profile');
      }

      const existing = await manager.getRepository(StudentFollow).findOne({
        where: {
          followerId: follower.id,
          followingId: following.id,
        },
      });

      if (existing) {
        return false;
      }

      await manager.getRepository(StudentFollow).save(
        manager.getRepository(StudentFollow).create({
          followerId: follower.id,
          followingId: following.id,
        }),
      );

      follower.followingCount += 1;
      following.followersCount += 1;
      await manager.getRepository(StudentProfile).save([follower, following]);
      return true;
    });

    if (isNewFollow) {
      void this.notificationService.sendNotification({
        recipient_id: studentId,
        notification_type: 'reels',
        title: 'New Follower',
        message: 'Someone started following you!',
      });
    }

    return { success: true };
  }

  async unfollowStudent(userId: string, studentId: string): Promise<{ success: boolean }> {
    await this.dataSource.transaction(async (manager) => {
      const follower = await this.ensureStudentProfile(userId, manager);
      const following = await this.ensureStudentProfile(studentId, manager);

      const existing = await manager.getRepository(StudentFollow).findOne({
        where: {
          followerId: follower.id,
          followingId: following.id,
        },
      });

      if (!existing) {
        return;
      }

      await manager.getRepository(StudentFollow).remove(existing);
      follower.followingCount = Math.max(0, follower.followingCount - 1);
      following.followersCount = Math.max(0, following.followersCount - 1);
      await manager.getRepository(StudentProfile).save([follower, following]);
    });

    return { success: true };
  }

  async updateStudentStatus(
    studentId: string,
    dto: UpdateStudentStatusDto,
  ): Promise<StudentProfileView> {
    const profile = await this.ensureStudentProfile(studentId);
    profile.status = dto.status;
    await this.studentProfileRepository.save(profile);

    return this.buildProfileView(profile);
  }

  async createReel(userId: string, dto: CreateReelDto): Promise<ReelView> {
    const creator = await this.requireActiveStudentProfile(userId);
    const normalizedVideoUrl = this.validateAndNormalizeVideoUrl(dto.videoUrl);
    const normalizedDuration = this.normalizeDuration(dto.durationSeconds);

    const reel = this.reelRepository.create({
      creatorId: creator.id,
      videoUrl: normalizedVideoUrl,
      durationSeconds: normalizedDuration.durationSeconds,
      wasTrimmed: normalizedDuration.wasTrimmed,
      caption: dto.caption?.trim() || undefined,
      tags: this.normalizeTags(dto.tags),
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      popularityScore: 0,
      isFlagged: false,
    });

    const saved = await this.reelRepository.save(reel);
    return this.getReelById(saved.id, userId);
  }

  async getReelById(reelId: string, userId?: string): Promise<ReelView> {
    const viewer = userId ? await this.ensureStudentProfile(userId) : undefined;
    const reel = await this.reelRepository.findOne({
      where: { id: reelId },
      relations: { creator: true },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    const [serialized] = await this.serializeReels([reel], viewer?.id);
    return serialized;
  }

  async deleteReel(userId: string, reelId: string): Promise<{ success: boolean; reelId: string }> {
    const viewer = await this.ensureStudentProfile(userId);
    const reel = await this.reelRepository.findOne({
      where: { id: reelId },
      relations: { creator: true },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    if (reel.creatorId !== viewer.id) {
      throw new ForbiddenException('Only the reel creator can delete this reel');
    }

    await this.reelRepository.remove(reel);
    return { success: true, reelId };
  }

  async adminDeleteReel(reelId: string): Promise<{ success: boolean; reelId: string }> {
    const reel = await this.reelRepository.findOne({ where: { id: reelId } });
    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    await this.reelRepository.remove(reel);
    return { success: true, reelId };
  }

  async getFeed(userId: string | undefined, dto: GetReelFeedDto): Promise<ReelFeedView> {
    const viewer = userId ? await this.ensureStudentProfile(userId) : undefined;
    const tab = viewer && dto.tab === 'followers' ? 'followers' : 'all';
    const orderBy = dto.orderBy === 'popularity' ? 'popularity' : 'chronological';
    const limit = this.normalizeLimit(dto.limit);

    const qb = this.reelRepository
      .createQueryBuilder('reel')
      .innerJoinAndSelect('reel.creator', 'creator')
      .where('creator.status = :status', { status: StudentProfileStatus.ACTIVE })
      .andWhere('reel.isFlagged = :isFlagged', { isFlagged: false });

    if (dto.cursorCreatedAt) {
      const cursorDate = new Date(dto.cursorCreatedAt);
      if (Number.isNaN(cursorDate.getTime())) {
        throw new BadRequestException('cursorCreatedAt must be a valid ISO datetime');
      }
      qb.andWhere('reel.createdAt < :cursorCreatedAt', { cursorCreatedAt: cursorDate.toISOString() });
    }

    if (tab === 'followers') {
      const followingRows = await this.followRepository.find({
        where: { followerId: viewer!.id },
      });
      const followingIds = followingRows.map((row) => row.followingId);

      if (!followingIds.length) {
        return { items: [], nextCursorCreatedAt: null };
      }

      qb.andWhere('reel.creatorId IN (:...followingIds)', { followingIds });
    }

    if (orderBy === 'popularity') {
      qb.orderBy('reel.popularityScore', 'DESC').addOrderBy('reel.createdAt', 'DESC');
    } else {
      qb.orderBy('reel.createdAt', 'DESC');
    }

    qb.take(limit + 1);

    const reels = await qb.getMany();
    const hasMore = reels.length > limit;
    const page = hasMore ? reels.slice(0, limit) : reels;

    const serialized = await this.serializeReels(page, viewer?.id);

    return {
      items: serialized,
      nextCursorCreatedAt: hasMore ? page[page.length - 1].createdAt.toISOString() : null,
    };
  }

  async likeReel(userId: string, reelId: string): Promise<ReelView> {
    const { view, creatorUserId, isNewLike } = await this.dataSource.transaction(async (manager) => {
      const student = await this.requireActiveStudentProfile(userId, manager);
      const reel = await this.requireReel(reelId, manager);

      const likeRepository = manager.getRepository(ReelLike);
      const existing = await likeRepository.findOne({
        where: { reelId: reel.id, studentId: student.id },
      });

      let isNewLike = false;
      if (!existing) {
        await likeRepository.save(
          likeRepository.create({
            reelId: reel.id,
            studentId: student.id,
          }),
        );
        reel.likesCount += 1;
        await manager.getRepository(Reel).save(reel);
        isNewLike = true;
      }

      await this.recomputePopularityScore(reel.id, manager);
      const view = await this.getReelByIdForViewer(reel.id, student.id, manager);

      let creatorUserId: string | undefined;
      if (isNewLike && reel.creatorId !== student.id) {
        const creator = await manager.getRepository(StudentProfile).findOne({ where: { id: reel.creatorId } });
        creatorUserId = creator?.userId;
      }

      return { view, creatorUserId, isNewLike };
    });

    if (isNewLike && creatorUserId) {
      void this.notificationService.sendNotification({
        recipient_id: creatorUserId,
        notification_type: 'reels',
        title: 'Reel Liked',
        message: 'Someone liked your reel!',
        metadata: { reelId },
      });
    }

    return view;
  }

  async unlikeReel(userId: string, reelId: string): Promise<ReelView> {
    return this.dataSource.transaction(async (manager) => {
      const student = await this.requireActiveStudentProfile(userId, manager);
      const reel = await this.requireReel(reelId, manager);

      const likeRepository = manager.getRepository(ReelLike);
      const existing = await likeRepository.findOne({
        where: { reelId: reel.id, studentId: student.id },
      });

      if (existing) {
        await likeRepository.remove(existing);
        reel.likesCount = Math.max(0, reel.likesCount - 1);
        await manager.getRepository(Reel).save(reel);
      }

      await this.recomputePopularityScore(reel.id, manager);
      return this.getReelByIdForViewer(reel.id, student.id, manager);
    });
  }

  async commentOnReel(userId: string, reelId: string, dto: CommentOnReelDto): Promise<ReelView> {
    const { view, creatorUserId } = await this.dataSource.transaction(async (manager) => {
      const student = await this.requireActiveStudentProfile(userId, manager);
      const reel = await this.requireReel(reelId, manager);

      const comment = dto.comment?.trim() ?? '';
      if (!comment) {
        throw new BadRequestException('comment is required');
      }
      if (comment.length > 1000) {
        throw new BadRequestException('comment must be less than 1000 characters');
      }

      const commentRepository = manager.getRepository(ReelComment);
      await commentRepository.save(
        commentRepository.create({
          reelId: reel.id,
          studentId: student.id,
          comment,
        }),
      );

      reel.commentsCount += 1;
      await manager.getRepository(Reel).save(reel);
      await this.recomputePopularityScore(reel.id, manager);

      const view = await this.getReelByIdForViewer(reel.id, student.id, manager);

      let creatorUserId: string | undefined;
      if (reel.creatorId !== student.id) {
        const creator = await manager.getRepository(StudentProfile).findOne({ where: { id: reel.creatorId } });
        creatorUserId = creator?.userId;
      }

      return { view, creatorUserId };
    });

    if (creatorUserId) {
      void this.notificationService.sendNotification({
        recipient_id: creatorUserId,
        notification_type: 'reels',
        title: 'New Comment',
        message: 'Someone commented on your reel.',
        metadata: { reelId },
      });
    }

    return view;
  }

  async shareReel(userId: string, reelId: string): Promise<ReelView> {
    return this.dataSource.transaction(async (manager) => {
      const student = await this.requireActiveStudentProfile(userId, manager);
      const reel = await this.requireReel(reelId, manager);

      const shareRepository = manager.getRepository(ReelShare);
      const existing = await shareRepository.findOne({
        where: { reelId: reel.id, studentId: student.id },
      });

      if (!existing) {
        await shareRepository.save(
          shareRepository.create({
            reelId: reel.id,
            studentId: student.id,
          }),
        );
        reel.sharesCount += 1;
        await manager.getRepository(Reel).save(reel);
      }

      await this.recomputePopularityScore(reel.id, manager);
      return this.getReelByIdForViewer(reel.id, student.id, manager);
    });
  }

  async unshareReel(userId: string, reelId: string): Promise<ReelView> {
    return this.dataSource.transaction(async (manager) => {
      const student = await this.requireActiveStudentProfile(userId, manager);
      const reel = await this.requireReel(reelId, manager);

      const shareRepository = manager.getRepository(ReelShare);
      const existing = await shareRepository.findOne({
        where: { reelId: reel.id, studentId: student.id },
      });

      if (existing) {
        await shareRepository.remove(existing);
        reel.sharesCount = Math.max(0, reel.sharesCount - 1);
        await manager.getRepository(Reel).save(reel);
      }

      await this.recomputePopularityScore(reel.id, manager);
      return this.getReelByIdForViewer(reel.id, student.id, manager);
    });
  }

  async reportReel(userId: string, reelId: string, dto: ReportReelDto): Promise<{ success: boolean }> {
    const student = await this.requireActiveStudentProfile(userId);
    const reel = await this.requireReel(reelId);

    const reason = dto.reason?.trim() ?? '';
    if (!reason) {
      throw new BadRequestException('reason is required');
    }

    await this.reportRepository.save(
      this.reportRepository.create({
        reelId: reel.id,
        studentId: student.id,
        reason,
        details: dto.details?.trim() || undefined,
      }),
    );

    return { success: true };
  }

  async listAdminReels(dto: AdminListReelsDto): Promise<ReelView[]> {
    const limit = this.normalizeLimit(dto.limit);

    const reels = await this.reelRepository.find({
      where: dto.flaggedOnly ? { isFlagged: true } : undefined,
      relations: { creator: true },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return this.serializeReels(reels);
  }

  async listAdminStudentProfiles(dto: AdminListStudentProfilesDto): Promise<AdminStudentProfileView[]> {
    const limit = this.normalizeLimit(dto.limit);

    const profiles = await this.studentProfileRepository.find({
      where: dto.status ? { status: dto.status } : undefined,
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return profiles.map((p) => ({
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      profilePhotoUrl: p.profilePhotoUrl,
      bio: p.bio,
      followersCount: p.followersCount,
      followingCount: p.followingCount,
      status: p.status,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
  }

  async searchProfiles(dto: SearchStudentProfilesDto): Promise<SearchProfileResult[]> {
    const q = dto.q?.trim() ?? '';
    if (!q) {
      return [];
    }
    const limit = Math.min(dto.limit ?? 20, 50);

    const profiles = await this.studentProfileRepository.find({
      where: { displayName: ILike(`%${q}%`), status: StudentProfileStatus.ACTIVE },
      order: { followersCount: 'DESC' },
      take: limit,
    });

    return profiles.map((p) => ({
      userId: p.userId,
      displayName: p.displayName,
      profilePhotoUrl: p.profilePhotoUrl,
      followersCount: p.followersCount,
      followingCount: p.followingCount,
      status: p.status,
    }));
  }

  async flagReel(reelId: string, dto: FlagReelDto): Promise<ReelView> {
    const reel = await this.requireReel(reelId);
    reel.isFlagged = dto.isFlagged;
    await this.reelRepository.save(reel);
    return this.getReelById(reel.id);
  }

  async getReelComments(reelId: string): Promise<ReelCommentView[]> {
    const reel = await this.reelRepository.findOne({ where: { id: reelId } });
    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    const comments = await this.commentRepository.find({
      where: { reelId: reel.id },
      relations: { student: true },
      order: { createdAt: 'DESC' },
    });

    return comments.map((c) => ({
      id: c.id,
      comment: c.comment,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      student: {
        userId: c.student.userId,
        displayName: c.student.displayName,
        profilePhotoUrl: c.student.profilePhotoUrl,
        status: c.student.status,
      },
    }));
  }

  async getReelLikes(reelId: string): Promise<ReelLikeView[]> {
    const reel = await this.reelRepository.findOne({ where: { id: reelId } });
    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    const likes = await this.likeRepository.find({
      where: { reelId: reel.id },
      relations: { student: true },
      order: { createdAt: 'DESC' },
    });

    return likes.map((l) => ({
      id: l.id,
      createdAt: l.createdAt,
      student: {
        userId: l.student.userId,
        displayName: l.student.displayName,
        profilePhotoUrl: l.student.profilePhotoUrl,
        status: l.student.status,
      },
    }));
  }

  async deleteComment(
    commentId: string,
    reelId: string,
    userId: string,
    isAdmin: boolean,
  ): Promise<{ success: boolean; commentId: string }> {
    return this.dataSource.transaction(async (manager) => {
      const commentRepository = manager.getRepository(ReelComment);
      const comment = await commentRepository.findOne({
        where: { id: commentId, reelId },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      if (!isAdmin) {
        const student = await this.ensureStudentProfile(userId, manager);
        if (comment.studentId !== student.id) {
          throw new ForbiddenException('You can only delete your own comments');
        }
      }

      await commentRepository.remove(comment);

      const reelRepository = manager.getRepository(Reel);
      const reel = await reelRepository.findOne({ where: { id: reelId } });
      if (reel) {
        reel.commentsCount = Math.max(0, reel.commentsCount - 1);
        await reelRepository.save(reel);
        await this.recomputePopularityScore(reelId, manager);
      }

      return { success: true, commentId };
    });
  }

  async getFollowers(studentId: string): Promise<StudentFollowView[]> {
    const profile = await this.ensureStudentProfile(studentId);

    const rows = await this.followRepository.find({
      where: { followingId: profile.id },
      relations: { follower: true },
      order: { createdAt: 'DESC' },
    });

    return rows.map((row) => ({
      userId: row.follower.userId,
      displayName: row.follower.displayName,
      profilePhotoUrl: row.follower.profilePhotoUrl,
      status: row.follower.status,
      followedAt: row.createdAt,
    }));
  }

  async getFollowing(studentId: string): Promise<StudentFollowView[]> {
    const profile = await this.ensureStudentProfile(studentId);

    const rows = await this.followRepository.find({
      where: { followerId: profile.id },
      relations: { following: true },
      order: { createdAt: 'DESC' },
    });

    return rows.map((row) => ({
      userId: row.following.userId,
      displayName: row.following.displayName,
      profilePhotoUrl: row.following.profilePhotoUrl,
      status: row.following.status,
      followedAt: row.createdAt,
    }));
  }

  async listAdminReports(): Promise<ReelReportView[]> {
    const reports = await this.reportRepository.find({
      relations: { student: true },
      order: { createdAt: 'DESC' },
    });

    return reports.map((report) => ({
      id: report.id,
      reelId: report.reelId,
      reason: report.reason,
      details: report.details,
      status: report.status,
      createdAt: report.createdAt,
      student: {
        userId: report.student.userId,
        displayName: report.student.displayName,
        profilePhotoUrl: report.student.profilePhotoUrl,
        status: report.student.status,
      },
    }));
  }

  async deleteReport(reportId: string): Promise<{ success: boolean }> {
    const report = await this.reportRepository.findOne({ where: { id: reportId } });
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    await this.reportRepository.remove(report);
    return { success: true };
  }

  async updateReportStatus(reportId: string, dto: UpdateReportStatusDto): Promise<ReelReportView> {
    const report = await this.reportRepository.findOne({
      where: { id: reportId },
      relations: { student: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const validStatuses = Object.values(ReelReportStatus);
    if (!validStatuses.includes(dto.status)) {
      throw new BadRequestException(`status must be one of: ${validStatuses.join(', ')}`);
    }

    report.status = dto.status;
    await this.reportRepository.save(report);

    return {
      id: report.id,
      reelId: report.reelId,
      reason: report.reason,
      details: report.details,
      status: report.status,
      createdAt: report.createdAt,
      student: {
        userId: report.student.userId,
        displayName: report.student.displayName,
        profilePhotoUrl: report.student.profilePhotoUrl,
        status: report.student.status,
      },
    };
  }

  private async buildProfileView(
    profile: StudentProfile,
    viewerStudentId?: string,
    manager?: EntityManager,
  ): Promise<StudentProfileView> {
    const reelRepository = this.getRepository(Reel, manager);
    const shareRepository = this.getRepository(ReelShare, manager);
    const followRepository = this.getRepository(StudentFollow, manager);

    const uploadedReels = await reelRepository.find({
      where: { creatorId: profile.id },
      relations: { creator: true },
      order: { createdAt: 'DESC' },
    });

    const shared = await shareRepository.find({
      where: { studentId: profile.id },
      relations: { reel: { creator: true } },
      order: { createdAt: 'DESC' },
    });

    let isFollowedByViewer = false;
    if (viewerStudentId && viewerStudentId !== profile.id) {
      const follow = await followRepository.findOne({
        where: {
          followerId: viewerStudentId,
          followingId: profile.id,
        },
      });
      isFollowedByViewer = Boolean(follow);
    }

    const sharedReels = shared.map((row) => row.reel).filter((reel): reel is Reel => Boolean(reel));

    return {
      userId: profile.userId,
      displayName: profile.displayName,
      profilePhotoUrl: profile.profilePhotoUrl,
      bio: profile.bio,
      followersCount: profile.followersCount,
      followingCount: profile.followingCount,
      status: profile.status,
      isFollowedByViewer,
      uploadedReels: await this.serializeReels(uploadedReels, viewerStudentId),
      sharedReels: await this.serializeReels(sharedReels, viewerStudentId),
    };
  }

  private async serializeReels(reels: Reel[], viewerStudentId?: string): Promise<ReelView[]> {
    if (!reels.length) {
      return [];
    }

    const reelIds = reels.map((reel) => reel.id);
    let likedIds = new Set<string>();
    let sharedIds = new Set<string>();

    if (viewerStudentId) {
      const [likes, shares] = await Promise.all([
        this.likeRepository.find({
          where: {
            studentId: viewerStudentId,
            reelId: In(reelIds),
          },
        }),
        this.shareRepository.find({
          where: {
            studentId: viewerStudentId,
            reelId: In(reelIds),
          },
        }),
      ]);

      likedIds = new Set(likes.map((like) => like.reelId));
      sharedIds = new Set(shares.map((share) => share.reelId));
    }

    return reels.map((reel) => this.toReelView(reel, likedIds.has(reel.id), sharedIds.has(reel.id)));
  }

  private toReelView(reel: Reel, isLikedByViewer: boolean, isSharedByViewer: boolean): ReelView {
    if (!reel.creator) {
      throw new NotFoundException('Reel creator not found');
    }

    return {
      id: reel.id,
      videoUrl: reel.videoUrl,
      durationSeconds: reel.durationSeconds,
      wasTrimmed: reel.wasTrimmed,
      caption: reel.caption,
      tags: reel.tags,
      likesCount: reel.likesCount,
      commentsCount: reel.commentsCount,
      sharesCount: reel.sharesCount,
      popularityScore: reel.popularityScore,
      isFlagged: reel.isFlagged,
      createdAt: reel.createdAt,
      updatedAt: reel.updatedAt,
      creator: {
        userId: reel.creator.userId,
        displayName: reel.creator.displayName,
        profilePhotoUrl: reel.creator.profilePhotoUrl,
        status: reel.creator.status,
      },
      isLikedByViewer,
      isSharedByViewer,
    };
  }

  private async getReelByIdForViewer(
    reelId: string,
    viewerStudentId: string,
    manager?: EntityManager,
  ): Promise<ReelView> {
    const reelRepository = this.getRepository(Reel, manager);
    const likeRepository = this.getRepository(ReelLike, manager);
    const shareRepository = this.getRepository(ReelShare, manager);

    const reel = await reelRepository.findOne({
      where: { id: reelId },
      relations: { creator: true },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    const [like, share] = await Promise.all([
      likeRepository.findOne({
        where: { reelId, studentId: viewerStudentId },
      }),
      shareRepository.findOne({
        where: { reelId, studentId: viewerStudentId },
      }),
    ]);

    return this.toReelView(reel, Boolean(like), Boolean(share));
  }

  private async ensureStudentProfile(
    userId: string,
    manager?: EntityManager,
  ): Promise<StudentProfile> {
    const repository = this.getRepository(StudentProfile, manager);
    let profile = await repository.findOne({ where: { userId } });

    if (profile) {
      return profile;
    }

    const displayName = await this.getFirstNameAndLastName(userId);

    profile = repository.create({
      userId,
      displayName: displayName || this.buildDefaultDisplayName(userId),
      followersCount: 0,
      followingCount: 0,
      status: StudentProfileStatus.ACTIVE,
    });

    return repository.save(profile);
  }

  private async requireActiveStudentProfile(
    userId: string,
    manager?: EntityManager,
  ): Promise<StudentProfile> {
    const profile = await this.ensureStudentProfile(userId, manager);
    if (profile.status !== StudentProfileStatus.ACTIVE) {
      throw new ForbiddenException('Student account is restricted');
    }
    return profile;
  }

  private async requireReel(reelId: string, manager?: EntityManager): Promise<Reel> {
    const reelRepository = this.getRepository(Reel, manager);
    const reel = await reelRepository.findOne({
      where: { id: reelId },
      relations: { creator: true },
    });
    if (!reel) {
      throw new NotFoundException('Reel not found');
    }
    return reel;
  }

  private async recomputePopularityScore(reelId: string, manager?: EntityManager): Promise<void> {
    const reelRepository = this.getRepository(Reel, manager);
    const commentRepository = this.getRepository(ReelComment, manager);

    const reel = await reelRepository.findOne({ where: { id: reelId } });
    if (!reel) {
      return;
    }

    const uniqueCommenters = await commentRepository
      .createQueryBuilder('comment')
      .select('COUNT(DISTINCT comment.studentId)', 'count')
      .where('comment.reelId = :reelId', { reelId })
      .getRawOne<{ count: string }>();

    const uniqueCommentCount = Number(uniqueCommenters?.count ?? 0);
    reel.popularityScore = reel.likesCount + uniqueCommentCount * 2 + reel.sharesCount * 3;
    await reelRepository.save(reel);
  }

  private normalizeTags(tags?: string[]): string[] {
    if (!Array.isArray(tags) || !tags.length) {
      return [];
    }

    const cleaned = tags
      .map((tag) => String(tag).trim())
      .filter((tag) => tag.length > 0)
      .map((tag) => tag.toLowerCase());

    return Array.from(new Set(cleaned)).slice(0, 20);
  }

  private normalizeDuration(durationSeconds: number): { durationSeconds: number; wasTrimmed: boolean } {
    if (!Number.isFinite(durationSeconds)) {
      throw new BadRequestException('durationSeconds is required');
    }

    if (durationSeconds < 1) {
      throw new BadRequestException('Video duration must be at least 1 second');
    }

    if (durationSeconds > 30) {
      return { durationSeconds: 30, wasTrimmed: true };
    }

    return {
      durationSeconds: Math.round(durationSeconds),
      wasTrimmed: false,
    };
  }

  private validateAndNormalizeVideoUrl(videoUrl: string): string {
    const normalized = videoUrl?.trim() ?? '';
    if (!normalized) {
      throw new BadRequestException('videoUrl is required');
    }

    if (!this.isValidHttpUrl(normalized)) {
      throw new BadRequestException('videoUrl must be a valid URL');
    }

    if (!normalized.toLowerCase().includes('.mp4')) {
      throw new BadRequestException('Only MP4 videos are supported');
    }

    const expectedBase = process.env.R2_PUBLIC_BASE_URL?.trim();
    if (expectedBase && !normalized.startsWith(expectedBase)) {
      throw new BadRequestException('videoUrl must belong to configured Cloudflare R2 bucket');
    }

    if (!expectedBase && !this.isLikelyCloudflareR2Url(normalized)) {
      throw new BadRequestException(
        'videoUrl should point to Cloudflare R2. Set R2_PUBLIC_BASE_URL for strict validation.',
      );
    }

    return normalized;
  }

  private isLikelyCloudflareR2Url(value: string): boolean {
    return value.includes('.r2.dev/') || value.includes('r2.cloudflarestorage.com');
  }

  private isValidHttpUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private normalizeLimit(limit?: number): number {
    if (limit === undefined) {
      return DEFAULT_FEED_LIMIT;
    }

    if (!Number.isFinite(limit) || limit <= 0) {
      throw new BadRequestException('limit must be a positive number');
    }

    return Math.min(Math.floor(limit), MAX_FEED_LIMIT);
  }

  private buildDefaultDisplayName(userId: string): string {
    const compact = userId.trim().replace(/\s+/g, '');
    const shortId = compact.length > 10 ? compact.slice(0, 10) : compact;
    return `Student ${shortId}`;
  }

  private getRepository<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    manager?: EntityManager,
  ): Repository<T> {
    return manager ? manager.getRepository(entity) : this.dataSource.getRepository(entity);
  }
  
  private async getFirstNameAndLastName(id: string): Promise<string> {
      try {
        const host = process.env.MAIN_SERVICE_BASE_URL;
        if (!host) {
          throw new BadGatewayException('MAIN_SERVICE_BASE_URL is not configured');
        }
  
        const getProfileUrl = `${host}/api/auth/profile/${id}`;
  
        const response = await fetch(getProfileUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
  
        if (!response.ok) {
  
          if (response.status === 404) {
            console.error('Main auth service responded with 404 Not Found:', await response.text());
            throw new NotFoundException('Profile not found!');
          }
  
          if (response.status >= 500) {
            throw new BadGatewayException('Main auth service is currently unreachable');
          }
  
          throw new BadGatewayException(
            `Main auth registration failed: ${response.status} ${response.statusText}`,
          );
        }
  
        const body = (await response.json()).data as MainAuthProfileResponse;
        return `${body.firstName} ${body.lastName}`;

      } catch (error) {
        if ( error instanceof BadGatewayException) {
          throw error;
        }
  
        if (error instanceof Error) {
          throw new BadGatewayException(`Failed to connect to main auth service: ${error.message}`);
        }
  
        throw new BadGatewayException('Failed to connect to main auth service');
      }
    }

}


